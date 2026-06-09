export function assertScraperAccess(request: Request) {
  const secret = process.env.SCRAPER_API_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret && !isProduction) return;

  if (!secret) {
    throw new Error("Missing SCRAPER_API_SECRET for scraper API.");
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (token !== secret) {
    throw new Error("Unauthorized scraper request.");
  }
}
