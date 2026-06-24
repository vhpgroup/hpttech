import { getPayloadClient } from "@/lib/payload";
import { formatSlug } from "@/lib/payload/utils/slugify";
import { normalizeSourceUrl } from "./source-identity";

type SourceCandidate = {
  productName: string;
  productUrl: string;
};

function normalizedTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export async function findExistingProductForSourceCandidate(
  candidate: SourceCandidate,
  baseUrl?: string,
) {
  const payload = await getPayloadClient();
  const sourceUrl = normalizeSourceUrl(candidate.productUrl, baseUrl);
  const slug = formatSlug(candidate.productName);
  const exact = await payload.find({
    collection: "products",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      or: [
        { "source.url": { equals: sourceUrl } },
        { slug: { equals: slug } },
        { title: { equals: candidate.productName } },
        { name: { equals: candidate.productName } },
      ],
    },
  });
  if (exact.docs[0]) return exact.docs[0];

  const model = candidate.productName.match(/\b[A-Z]{1,6}(?:[-\s]?[A-Z0-9]){2,16}\b/gi)
    ?.map((item) => item.replace(/\s+/g, "-").toUpperCase())
    .find((item) => /\d/.test(item));
  if (!model) return undefined;

  const modelMatches = await payload.find({
    collection: "products",
    depth: 0,
    limit: 25,
    overrideAccess: true,
    where: { title: { like: model } },
  });
  const candidateTitle = normalizedTitle(candidate.productName);
  return modelMatches.docs.find((product) => {
    const title =
      typeof product.title === "string"
        ? product.title
        : typeof product.name === "string"
          ? product.name
          : "";
    const normalized = normalizedTitle(title);
    return normalized === candidateTitle || normalized.includes(normalizedTitle(model));
  });
}
