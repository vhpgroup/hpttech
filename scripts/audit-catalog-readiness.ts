import { loadEnvConfig } from "@next/env";
import { relationID } from "../lib/catalog-schema.ts";

loadEnvConfig(process.cwd());

type Doc = Record<string, unknown> & { id?: string | number };

function text(doc: Doc | undefined, key: string) {
  const value = doc?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function id(value: unknown) {
  return relationID(value);
}

function relationDoc(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Doc)
    : undefined;
}

function groupCount(items: Doc[], key: (item: Doc) => string) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) || 0) + 1);
  return Object.fromEntries([...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

function duplicateKeys(items: Doc[], key: (item: Doc) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = key(item);
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));
}

function productLabel(product: Doc) {
  return {
    id: product.id,
    name: text(product, "name") || text(product, "title"),
    slug: text(product, "slug"),
  };
}

async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();
  const read = async (collection: string, depth = 0) => {
    const result = await payload.find({
      collection: collection as never,
      depth,
      limit: 5000,
      overrideAccess: true,
    });
    return result.docs as Doc[];
  };

  const [
    products,
    productTypes,
    definitions,
    variants,
    offers,
    inventory,
    metadata,
  ] = await Promise.all([
    read("products", 2),
    read("product-types"),
    read("attribute-definitions"),
    read("product-variants"),
    read("product-offers"),
    read("product-inventory"),
    read("product-ai-metadata"),
  ]);

  const productIDs = new Set(products.map((product) => String(product.id)));
  const variantIDs = new Set(variants.map((variant) => String(variant.id)));
  const variantsByProduct = new Map<string, Doc[]>();
  const offersByVariant = new Map<string, Doc[]>();
  const inventoryByVariant = new Map<string, Doc[]>();
  const metadataByProduct = new Map<string, Doc[]>();
  const definitionsByProductType = new Map<string, Doc[]>();

  for (const variant of variants) {
    const productID = id(variant.product);
    if (productID !== undefined) variantsByProduct.set(String(productID), [...(variantsByProduct.get(String(productID)) || []), variant]);
  }
  for (const offer of offers) {
    const variantID = id(offer.variant);
    if (variantID !== undefined) offersByVariant.set(String(variantID), [...(offersByVariant.get(String(variantID)) || []), offer]);
  }
  for (const stock of inventory) {
    const variantID = id(stock.variant);
    if (variantID !== undefined) inventoryByVariant.set(String(variantID), [...(inventoryByVariant.get(String(variantID)) || []), stock]);
  }
  for (const row of metadata) {
    const productID = id(row.product);
    if (productID !== undefined) metadataByProduct.set(String(productID), [...(metadataByProduct.get(String(productID)) || []), row]);
  }
  for (const definition of definitions) {
    const productTypeID = id(definition.productType);
    if (productTypeID !== undefined) {
      definitionsByProductType.set(String(productTypeID), [
        ...(definitionsByProductType.get(String(productTypeID)) || []),
        definition,
      ]);
    }
  }

  const canonical = products.filter((product) => product.dataModel === "canonical");
  const issues = [];

  for (const product of canonical) {
    const productID = String(product.id);
    const productTypeID = id(product.productType);
    const productVariants = variantsByProduct.get(productID) || [];
    const primaryVariants = productVariants.filter((variant) => variant.isPrimary === true);
    const productIssues = [];

    if (!text(product, "internalId")) productIssues.push("missing internalId");
    if (!productTypeID) productIssues.push("missing productType");
    if (!id(product.brand)) productIssues.push("missing brand");
    if (!id(product.category)) productIssues.push("missing category");
    if (!text(product, "model")) productIssues.push("missing model");
    if (!text(product, "slug")) productIssues.push("missing slug");
    if (!productVariants.length) productIssues.push("missing variant");
    if (!primaryVariants.length) productIssues.push("missing primary variant");
    if (primaryVariants.length > 1) productIssues.push("multiple primary variants");
    if (!metadataByProduct.has(productID)) productIssues.push("missing AI metadata");

    for (const variant of productVariants) {
      const variantID = String(variant.id);
      if (!offersByVariant.has(variantID)) productIssues.push(`variant ${text(variant, "sku")} missing offer`);
      if (!inventoryByVariant.has(variantID)) productIssues.push(`variant ${text(variant, "sku")} missing inventory`);
    }

    if (product.status === "published" && productTypeID !== undefined) {
      const required = (definitionsByProductType.get(String(productTypeID)) || []).filter(
        (definition) => definition.required === true && definition.status === "active",
      );
      const supplied = new Set(
        Array.isArray(product.attributes)
          ? product.attributes
              .map((row) => id(relationDoc(row)?.definition))
              .filter((definitionID) => definitionID !== undefined)
              .map(String)
          : [],
      );
      const missingRequired = required.filter((definition) => !supplied.has(String(definition.id)));
      if (missingRequired.length) {
        productIssues.push(`missing required attributes: ${missingRequired.map((definition) => text(definition, "code")).join(", ")}`);
      }
    }

    if (productIssues.length) issues.push({ product: productLabel(product), issues: productIssues });
  }

  const report = {
    counts: {
      aiMetadata: metadata.length,
      attributeDefinitions: definitions.length,
      inventory: inventory.length,
      offers: offers.length,
      productTypes: productTypes.length,
      products: products.length,
      variants: variants.length,
    },
    duplicates: {
      attributeCodes: duplicateKeys(definitions, (definition) => text(definition, "code")),
      inventoryVariantWarehouse: duplicateKeys(inventory, (row) => `${id(row.variant) || ""}::${text(row, "warehouseName").toLowerCase()}`),
      productInternalIds: duplicateKeys(products, (product) => text(product, "internalId")),
      productSlugs: duplicateKeys(products, (product) => text(product, "slug")),
      variantSkus: duplicateKeys(variants, (variant) => text(variant, "sku")),
    },
    orphans: {
      inventoryWithoutVariant: inventory.filter((row) => {
        const variantID = id(row.variant);
        return variantID === undefined || !variantIDs.has(String(variantID));
      }).length,
      metadataWithoutProduct: metadata.filter((row) => {
        const productID = id(row.product);
        return productID === undefined || !productIDs.has(String(productID));
      }).length,
      offersWithoutVariant: offers.filter((row) => {
        const variantID = id(row.variant);
        return variantID === undefined || !variantIDs.has(String(variantID));
      }).length,
      variantsWithoutProduct: variants.filter((row) => {
        const productID = id(row.product);
        return productID === undefined || !productIDs.has(String(productID));
      }).length,
    },
    productBreakdown: {
      byDataModel: groupCount(products, (product) => text(product, "dataModel") || "unset"),
      byStatus: groupCount(products, (product) => text(product, "status") || "unset"),
      canonical: canonical.length,
      legacy: products.length - canonical.length,
    },
    readiness: {
      canonicalIssues: issues.length,
      ready: issues.length === 0,
    },
    samples: issues.slice(0, 20),
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(issues.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
