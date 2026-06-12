import type { ExtractedProductData } from "./types";

export function normalizeModelIdentity(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function extractRequestedModel(value: string) {
  const normalizedValue = value.replace(/[\u2010-\u2015\u2212]/g, "-");
  const splitModel = normalizedValue
    .match(/\b\d{4,5}\s+(?:FNW|SNW|FN|F|S)\d\b/gi)
    ?.at(-1);
  if (splitModel) return splitModel.replace(/\s+/, "-").toUpperCase();

  const primaryMatches =
    normalizedValue.match(
      /\b(?=[A-Z0-9-]*\d)[A-Z]{1,8}(?:-[A-Z0-9]+)+\b|\b(?=[A-Z0-9]*\d)[A-Z]{1,8}\d[A-Z0-9]*\b/gi,
    ) || [];
  const primary = primaryMatches
    .filter((match) => {
      const normalized = normalizeModelIdentity(match);
      return normalized.length >= 2 && !/^(?:A3|A4)$/.test(normalized);
    })
    .filter((match, _index, matches) => {
      const normalized = normalizeModelIdentity(match);
      const hasMainModel = matches.some((candidate) =>
        /\d{3,}/.test(normalizeModelIdentity(candidate)),
      );
      return !hasMainModel || !/^(?:FNW|SNW|FN|F|S)\d$/i.test(normalized);
    })
    .map((match) => match.toUpperCase())
    .at(-1);
  if (primary) return primary;

  const namedModel = normalizedValue
    .match(/\bX-MINI\b/gi)
    ?.at(-1);
  if (namedModel) return namedModel.toUpperCase();

  return normalizedValue
    .match(/\b(?=[A-Z0-9]*\d)[A-Z0-9]{2,12}\b/gi)
    ?.filter((match) => !/^(?:A3|A4)$/.test(match.toUpperCase()))
    .at(-1)
    ?.toUpperCase();
}

export function textContainsModel(value: string, model: string) {
  return normalizeModelIdentity(value).includes(normalizeModelIdentity(model));
}

export function alignExtractedProductModel(
  data: ExtractedProductData,
  requestedName: string,
): ExtractedProductData {
  const requestedModel = extractRequestedModel(requestedName);
  if (!requestedModel) {
    throw new Error(`Khong xac dinh duoc model tu input: ${requestedName}.`);
  }

  return {
    ...data,
    sku: requestedModel,
    title: textContainsModel(data.title, requestedModel)
      ? data.title
      : requestedName,
  };
}
