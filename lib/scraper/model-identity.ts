import type { ExtractedProductData } from "./types";

export function normalizeModelIdentity(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function isPaperSizeToken(value: string) {
  return /^(?:A(?:0|1|2|3|4|5|6|7|8|9|10)|LEGAL|LETTER|TABLOID|LEDGER)$/i.test(
    normalizeModelIdentity(value),
  );
}

function scoreModelCandidate(value: string) {
  const normalized = normalizeModelIdentity(value);
  let score = 0;

  if (/[A-Z]/.test(normalized) && /\d/.test(normalized)) score += 10;
  if (/^\d[A-Z]{1,2}\d[A-Z0-9]{2,}$/.test(normalized)) score += 45;
  if (/^(?:\d[A-Z]\d|[A-Z]\d[A-Z0-9]{3,})[A-Z0-9]*$/.test(normalized)) score += 40;
  if (
    /^(?:[A-Z]{1,8}\d[A-Z0-9]*|\d{3,6}[A-Z]{1,6}[A-Z0-9]*)$/.test(normalized)
  ) {
    score += 25;
  }
  if (/\d{3,}/.test(normalized)) score += 10;
  if (normalized.length >= 5 && normalized.length <= 8) score += 5;

  return score;
}

function bestModelCandidate(matches: string[]) {
  return matches
    .map((match, index) => ({
      index,
      match: match.toUpperCase(),
      score: scoreModelCandidate(match),
    }))
    .sort((left, right) => right.score - left.score || right.index - left.index)[0]
    ?.match;
}

export function extractRequestedModel(value: string) {
  const normalizedValue = value.replace(/[\u2010-\u2015\u2212]/g, "-");
  const splitModel = normalizedValue
    .match(/\b\d{4,5}\s+(?:FNW|SNW|FN|F|S)\d\b/gi)
    ?.at(-1);
  if (splitModel) return splitModel.replace(/\s+/, "-").toUpperCase();

  const primaryMatches =
    normalizedValue.match(
      /\b(?=[A-Z0-9-]*\d)[A-Z]{1,8}(?:-[A-Z0-9]+)+\b|\b(?=[A-Z0-9]*\d)(?:[A-Z]{1,8}\d[A-Z0-9]*|\d{3,6}[A-Z]{1,6}[A-Z0-9]*|\d(?=[A-Z0-9]*[A-Z])[A-Z0-9]{4,9})\b/gi,
    ) || [];
  const primary = primaryMatches
    .filter((match) => {
      const normalized = normalizeModelIdentity(match);
      return normalized.length >= 2 && !isPaperSizeToken(normalized);
    })
    .filter((match, _index, matches) => {
      const normalized = normalizeModelIdentity(match);
      const hasMainModel = matches.some((candidate) =>
        /\d{3,}/.test(normalizeModelIdentity(candidate)),
      );
      return !hasMainModel || !/^(?:FNW|SNW|FN|F|S)\d$/i.test(normalized);
    });
  const bestPrimary = bestModelCandidate(primary);
  if (bestPrimary) return bestPrimary;

  const namedModel = normalizedValue
    .match(/\bX-MINI\b/gi)
    ?.at(-1);
  if (namedModel) return namedModel.toUpperCase();

  return bestModelCandidate(
    normalizedValue
    .match(/\b(?=[A-Z0-9]*\d)[A-Z0-9]{2,12}\b/gi)
      ?.filter((match) => !isPaperSizeToken(match)) || [],
  );
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
