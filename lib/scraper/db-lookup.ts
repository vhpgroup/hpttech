import { getPayloadClient } from "@/lib/payload";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();
}

export function commonProductTypeCode(value: string) {
  const normalized = normalize(value);
  if (normalized.includes("scan")) return "scanner";
  if (
    normalized.includes("photocopy") ||
    normalized.includes("photocopier") ||
    normalized.includes("copy")
  ) {
    return "photocopier";
  }
  if (normalized.includes("may in") || normalized.includes("printer")) {
    return "printer";
  }
  if (
    normalized.includes("phan mem") ||
    normalized.includes("software") ||
    normalized.includes("antivirus") ||
    normalized.includes("office") ||
    normalized.includes("windows")
  ) {
    return "software";
  }
  return undefined;
}

export async function resolveProductTypeCode(value: string) {
  const common = commonProductTypeCode(value);
  if (common) return common;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "product-types",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      or: [
        { code: { equals: value.trim() } },
        { name: { equals: value.trim() } },
      ],
    },
  });
  const productType = result.docs[0];
  if (!productType?.code) {
    throw new Error(`Khong tim thay Product Type: ${value}.`);
  }
  return productType.code;
}
