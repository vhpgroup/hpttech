import { generatePageMetadata, RootPage } from "@payloadcms/next/views";
import { redirect } from "next/navigation";
import config from "@/payload.config";
import { importMap } from "./importMap";

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams });

function getSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function redirectAwayFromLongProductsColumnsURL(params: Args["params"], searchParams: Args["searchParams"]) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const segments = resolvedParams.segments || [];
  const isProductsList = segments[0] === "collections" && segments[1] === "products" && segments.length === 2;

  if (!isProductsList || !resolvedSearchParams.columns) {
    return;
  }

  const nextSearchParams = new URLSearchParams();
  for (const key of ["page", "limit", "sort", "where"]) {
    const value = getSearchParamValue(resolvedSearchParams[key]);
    if (value) nextSearchParams.set(key, value);
  }

  const nextQuery = nextSearchParams.toString();
  redirect(`/admin/collections/products${nextQuery ? `?${nextQuery}` : ""}`);
}

export default async function Page({ params, searchParams }: Args) {
  await redirectAwayFromLongProductsColumnsURL(params, searchParams);

  return RootPage({
    config,
    importMap,
    params,
    searchParams,
  });
}
