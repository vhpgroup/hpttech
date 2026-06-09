import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
} from "payload";
import { relationID } from "@/lib/catalog-schema";

async function countRelated(
  req: Parameters<CollectionBeforeDeleteHook>[0]["req"],
  collection: string,
  field: string,
  id: string | number,
) {
  const result = await req.payload.count({
    collection: collection as never,
    overrideAccess: true,
    where: {
      [field]: {
        equals: id,
      },
    },
  });
  return result.totalDocs;
}

export const preventProductDeleteWithVariants: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const [variantCount, metadataCount] = await Promise.all([
    countRelated(req, "product-variants", "product", id),
    countRelated(req, "product-ai-metadata", "product", id),
  ]);
  if (variantCount > 0 || metadataCount > 0) {
    throw new Error(
      `Không thể xóa Product đang có ${variantCount} SKU/Variant và ${metadataCount} AI metadata. Hãy chuyển Product sang Lưu trữ, hoặc xóa dữ liệu con theo thứ tự AI Metadata → Inventory → Offer → Variant.`,
    );
  }
};

export const preventVariantDeleteWithCommercialData: CollectionBeforeDeleteHook =
  async ({ id, req }) => {
    const [offerCount, inventoryCount] = await Promise.all([
      countRelated(req, "product-offers", "variant", id),
      countRelated(req, "product-inventory", "variant", id),
    ]);
    if (offerCount || inventoryCount) {
      throw new Error(
        `Không thể xóa SKU đang có ${offerCount} Offer và ${inventoryCount} bản ghi tồn kho. Hãy xóa dữ liệu thương mại trước.`,
      );
    }
  };

export const validateSinglePrimaryVariant: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (data.isPrimary !== true) return data;
  const productID = relationID(data.product);
  if (!productID) return data;

  const existing = await req.payload.find({
    collection: "product-variants" as never,
    depth: 0,
    limit: 10,
    overrideAccess: true,
    where: {
      and: [
        { product: { equals: productID } },
        { isPrimary: { equals: true } },
      ],
    },
  });
  const currentID = relationID(originalDoc?.id);
  const duplicate = existing.docs.find(
    (doc) => relationID((doc as Record<string, unknown>).id) !== currentID,
  );
  if (duplicate) {
    throw new Error("Mỗi Product chỉ được có một SKU mặc định.");
  }
  return data;
};

export const validateUniqueWarehouseInventory: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const variantID = relationID(data.variant);
  const warehouseName =
    typeof data.warehouseName === "string" ? data.warehouseName.trim() : "";
  if (!variantID || !warehouseName) return data;

  const existing = await req.payload.find({
    collection: "product-inventory" as never,
    depth: 0,
    limit: 10,
    overrideAccess: true,
    where: {
      and: [
        { variant: { equals: variantID } },
        { warehouseName: { equals: warehouseName } },
      ],
    },
  });
  const currentID = relationID(originalDoc?.id);
  const duplicate = existing.docs.find(
    (doc) => relationID((doc as Record<string, unknown>).id) !== currentID,
  );
  if (duplicate) {
    throw new Error("SKU đã có bản ghi tồn kho cho kho này.");
  }
  return {
    ...data,
    warehouseName,
  };
};
