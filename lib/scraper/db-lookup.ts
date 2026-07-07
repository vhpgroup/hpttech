import { getPayloadClient } from "@/lib/payload";
import { detectPcServerTypeCode } from "./pc-server-taxonomy";

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
  if (
    normalized.includes("muc in") ||
    normalized.includes("muc may in") ||
    normalized.includes("hop muc") ||
    normalized.includes("toner") ||
    normalized.includes("cartridge") ||
    normalized.includes("drum") ||
    normalized.includes("muc photo") ||
    normalized.includes("vat tu may in") ||
    normalized.includes("phu kien may in") ||
    normalized.includes("linh kien may in")
  ) {
    return "ink";
  }
  if (normalized.includes("may in") || normalized.includes("printer")) {
    return "printer";
  }
  // PC/Server (anphat "Máy tính đồng bộ - Máy chủ") phải đứng TRƯỚC rule
  // software: tên PC thường chứa "Windows 11"/"Office" nhưng không phải phần mềm.
  // detectPcServerTypeCode tự bỏ qua khi văn bản nhắc laptop/phần mềm/bản quyền.
  const pcServerType = detectPcServerTypeCode(value);
  if (pcServerType) return pcServerType;
  if (
    normalized.includes("phan mem") ||
    normalized.includes("software") ||
    normalized.includes("antivirus") ||
    normalized.includes("office") ||
    normalized.includes("windows")
  ) {
    return "software";
  }
  if (
    normalized.includes("laptop") ||
    normalized.includes("notebook") ||
    normalized.includes("may tinh xach tay")
  ) {
    return "laptop";
  }
  if (
    normalized.includes("camera") ||
    normalized.includes("dau ghi") ||
    normalized.includes("nvr") ||
    normalized.includes("cctv")
  ) {
    return "camera";
  }
  if (
    normalized.includes("thiet bi mang") ||
    normalized.includes("router") ||
    normalized.includes("switch") ||
    normalized.includes("wifi") ||
    normalized.includes("access point") ||
    normalized.includes("bo phat") ||
    normalized.includes("chia mang") ||
    normalized.includes("firewall") ||
    normalized.includes("card mang") ||
    normalized.includes("can bang tai") ||
    normalized.includes("load balancer") ||
    normalized.includes("poe")
  ) {
    return "networking";
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
