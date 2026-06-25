import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";

async function postRevalidate(payload: Record<string, unknown>) {
  const baseURL = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!baseURL || !secret) return;

  const url = baseURL.startsWith("http") ? baseURL : `https://${baseURL}`;

  try {
    await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("[payload-revalidate] request failed", error);
  }
}

export const revalidateCollection: CollectionAfterChangeHook = async ({ collection, doc }) => {
  await postRevalidate({
    collection: collection.slug,
    path:
      typeof doc?.fullPath === "string"
        ? doc.fullPath
        : typeof doc?.fullSlug === "string"
          ? doc.fullSlug
          : undefined,
    slug: typeof doc?.slug === "string" ? doc.slug : undefined,
  });
};

export const revalidateCollectionDelete: CollectionAfterDeleteHook = async ({ collection, doc }) => {
  await postRevalidate({
    collection: collection.slug,
    deleted: true,
    slug: typeof doc?.slug === "string" ? doc.slug : undefined,
  });
};

export const revalidateGlobal: GlobalAfterChangeHook = async ({ global }) => {
  await postRevalidate({
    global: global.slug,
  });
};
