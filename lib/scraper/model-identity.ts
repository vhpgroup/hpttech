import type { ExtractedProductData } from "./types";

export function normalizeModelIdentity(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function extractRequestedModel(value: string) {
  const matches =
    value.match(
      /\b(?=[A-Z0-9-]*\d)[A-Z]{1,8}(?:-[A-Z0-9]+)+\b|\b(?=[A-Z0-9]*\d)[A-Z]{1,8}\d[A-Z0-9]*\b/gi,
    ) || [];
  return matches
    .filter((match) => normalizeModelIdentity(match).length >= 4)
    .map((match) => match.toUpperCase())
    .at(-1);
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
