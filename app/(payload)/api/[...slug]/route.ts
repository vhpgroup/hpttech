import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";
import config from "@/payload.config";

type PayloadRouteArgs = {
  params: Promise<{
    slug?: string[];
  }>;
};

const payloadDelete = REST_DELETE(config);

function isInvalidInQueryValue(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  return (
    normalizedValue === "" ||
    normalizedValue === "null" ||
    normalizedValue === "undefined" ||
    normalizedValue === "nan"
  );
}

function sanitizeDeleteQuery(request: Request) {
  const url = new URL(request.url);
  let changed = false;
  let hadWhereQuery = false;
  const cleanedSearchParams = new URLSearchParams();

  for (const [key, value] of url.searchParams.entries()) {
    const isWhereQuery = key.startsWith("where[") || key === "where";
    const isInvalidInValue = key.includes("[in]") && isInvalidInQueryValue(value);

    if (isWhereQuery) {
      hadWhereQuery = true;
    }

    if (isInvalidInValue) {
      changed = true;
      continue;
    }

    cleanedSearchParams.append(key, value);
  }

  if (!changed) return request;

  url.search = cleanedSearchParams.toString();
  const hasRemainingWhereQuery = Array.from(cleanedSearchParams.keys()).some(
    (key) => key.startsWith("where[") || key === "where",
  );

  return {
    request: new Request(url, request),
    shouldNoop: hadWhereQuery && !hasRemainingWhereQuery,
  };
}

export const DELETE = (request: Request, args: PayloadRouteArgs) => {
  const sanitized = sanitizeDeleteQuery(request);

  if (sanitized instanceof Request) {
    return payloadDelete(sanitized, args);
  }

  if (sanitized.shouldNoop) {
    return Response.json(
      {
        errors: [
          {
            message: "Không thể xóa sản phẩm vì request không có ID hợp lệ.",
          },
        ],
      },
      { status: 400 },
    );
  }

  return payloadDelete(sanitized.request, args);
};
export const GET = REST_GET(config);
export const OPTIONS = REST_OPTIONS(config);
export const PATCH = REST_PATCH(config);
export const POST = REST_POST(config);
export const PUT = REST_PUT(config);
