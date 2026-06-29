import { loadEnvConfig } from "@next/env";
import { getPayloadClient } from "../lib/payload";
import {
  SOFTWARE_CATEGORY_NAME,
  SOFTWARE_CATEGORY_SLUG,
  canonicalizeCategoryName,
  isSoftwareCategoryValue,
} from "../lib/product-category";

loadEnvConfig(process.cwd());

type Doc = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
  parent?: number | string | { id?: number | string } | null;
};

type PayloadWrite = {
  create(options: {
    collection: string;
    data: Record<string, unknown>;
    overrideAccess?: boolean;
  }): Promise<unknown>;
  update(options: {
    collection: string;
    data: Record<string, unknown>;
    id: string | number;
    overrideAccess?: boolean;
  }): Promise<unknown>;
};

function relationId(value: Doc["parent"]) {
  if (typeof value === "string" || typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) return value.id;
  return undefined;
}

function numericPayloadId(value: unknown) {
  const id =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : undefined;
  return Number.isFinite(id) ? id : undefined;
}

async function listAll(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  collection: "categories" | "products",
) {
  const docs: Array<Record<string, unknown>> = [];
  let page = 1;

  while (true) {
    const result = await payload.find({
      collection,
      depth: 1,
      limit: 200,
      overrideAccess: true,
      page,
    });
    docs.push(...(result.docs as unknown as Array<Record<string, unknown>>));
    if (page >= result.totalPages) break;
    page += 1;
  }

  return docs;
}

async function main() {
  console.log("Starting software category merge...");
  const payload = await getPayloadClient();
  console.log("Payload client ready.");
  const writePayload = payload as unknown as PayloadWrite;
  const categoryDocs = (await listAll(payload, "categories")) as Doc[];
  console.log(`Loaded ${categoryDocs.length} categories.`);
  const softwareCategories = categoryDocs.filter(
    (doc) =>
      isSoftwareCategoryValue(doc.name || undefined) ||
      isSoftwareCategoryValue(doc.slug || undefined),
  );

  let canonical =
    softwareCategories.find(
      (doc) =>
        canonicalizeCategoryName(doc.name || undefined) === SOFTWARE_CATEGORY_NAME &&
        doc.slug === SOFTWARE_CATEGORY_SLUG,
    ) ||
    softwareCategories.find(
      (doc) => canonicalizeCategoryName(doc.name || undefined) === SOFTWARE_CATEGORY_NAME,
    );

  if (!canonical) {
    canonical = (await writePayload.create({
      collection: "categories",
      data: {
        description:
          "Phần mềm bản quyền, ứng dụng văn phòng, hệ điều hành và bảo mật.",
        name: SOFTWARE_CATEGORY_NAME,
        slug: SOFTWARE_CATEGORY_SLUG,
      },
      overrideAccess: true,
    })) as unknown as Doc;
  } else {
    canonical = (await writePayload.update({
      collection: "categories",
      id: canonical.id,
      data: {
        name: SOFTWARE_CATEGORY_NAME,
        slug: SOFTWARE_CATEGORY_SLUG,
      },
      overrideAccess: true,
    })) as unknown as Doc;
  }

  const mergeIds = softwareCategories
    .map((doc) => doc.id)
    .filter((id) => id !== canonical.id);

  let updatedChildren = 0;
  for (const category of categoryDocs) {
    const parentId = relationId(category.parent);
    if (!parentId || !mergeIds.includes(parentId) || category.id === canonical.id) continue;
    await writePayload.update({
      collection: "categories",
      id: category.id,
      data: { parent: numericPayloadId(canonical.id) ?? canonical.id },
      overrideAccess: true,
    });
    updatedChildren += 1;
  }

  const productDocs = await listAll(payload, "products");
  console.log(`Loaded ${productDocs.length} products.`);
  let updatedProducts = 0;
  for (const product of productDocs) {
    const categoryId =
      typeof product.category === "object" && product.category && "id" in product.category
        ? (product.category as { id?: string | number }).id
        : product.category;

    if (!categoryId || !mergeIds.includes(categoryId as string | number)) continue;

    await writePayload.update({
      collection: "products",
      id: product.id as string | number,
      data: { category: numericPayloadId(canonical.id) ?? canonical.id },
      overrideAccess: true,
    });
    updatedProducts += 1;
  }

  let deletedCategories = 0;
  for (const categoryId of mergeIds) {
    await payload.delete({
      collection: "categories",
      id: categoryId,
      overrideAccess: true,
    });
    deletedCategories += 1;
  }

  console.log(
    JSON.stringify(
      {
        canonicalCategoryId: canonical.id,
        deletedCategories,
        updatedChildren,
        updatedProducts,
      },
      null,
      2,
    ),
  );

  await payload.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
