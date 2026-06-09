type MisaAuthScheme = "Bearer" | "ApiKey" | "Raw" | "None";

type MisaConfig = {
  appId?: string;
  authHeader: string;
  authScheme: MisaAuthScheme;
  baseUrl?: string;
  companyHeader?: string;
  companyId?: string;
  connectionCode?: string;
  testPath: string;
};

export type MisaConnectionResult = {
  bodySample?: string;
  configured: {
    appId: boolean;
    authHeader: string;
    authScheme: MisaAuthScheme;
    baseUrl: boolean;
    companyId: boolean;
    connectionCode: boolean;
    testPath: string;
  };
  contentType?: string | null;
  ok: boolean;
  responseTimeMs?: number;
  status?: number;
  statusText?: string;
  url?: string;
};

export function getMisaConfig(): MisaConfig {
  const authScheme = (process.env.MISA_AUTH_SCHEME || "Bearer") as MisaAuthScheme;

  return {
    appId: process.env.MISA_APP_ID,
    authHeader: process.env.MISA_AUTH_HEADER || (authScheme === "Bearer" ? "Authorization" : "X-API-Key"),
    authScheme,
    baseUrl: process.env.MISA_BASE_URL,
    companyHeader: process.env.MISA_COMPANY_HEADER || "X-Company-Id",
    companyId: process.env.MISA_COMPANY_ID,
    connectionCode: process.env.MISA_CONNECTION_CODE || process.env.MISA_API_KEY,
    testPath: process.env.MISA_TEST_PATH || "/",
  };
}

function buildMisaUrl(baseUrl: string, path: string) {
  return new URL(path.replace(/^\/?/, "/"), baseUrl).toString();
}

function authValue(config: MisaConfig) {
  if (!config.connectionCode || config.authScheme === "None") return undefined;
  if (config.authScheme === "Bearer") return `Bearer ${config.connectionCode}`;
  return config.connectionCode;
}

export async function testMisaConnection(): Promise<MisaConnectionResult> {
  const config = getMisaConfig();
  const configured = {
    appId: Boolean(config.appId),
    authHeader: config.authHeader,
    authScheme: config.authScheme,
    baseUrl: Boolean(config.baseUrl),
    companyId: Boolean(config.companyId),
    connectionCode: Boolean(config.connectionCode),
    testPath: config.testPath,
  };

  if (!config.baseUrl) {
    return { ok: false, configured, statusText: "Missing MISA_BASE_URL" };
  }

  const headers = new Headers({ Accept: "application/json" });
  const authorization = authValue(config);
  if (authorization) headers.set(config.authHeader, authorization);
  if (config.companyId && config.companyHeader) headers.set(config.companyHeader, config.companyId);

  const url = buildMisaUrl(config.baseUrl, config.testPath);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers,
      method: "GET",
      signal: AbortSignal.timeout(15_000),
    });
    const text = await response.text();

    return {
      bodySample: text.slice(0, 1200),
      configured,
      contentType: response.headers.get("content-type"),
      ok: response.ok,
      responseTimeMs: Math.round(performance.now() - startedAt),
      status: response.status,
      statusText: response.statusText,
      url,
    };
  } catch (error) {
    const cause = error instanceof Error && "cause" in error ? error.cause : undefined;
    const message = [
      error instanceof Error ? error.message : String(error),
      cause instanceof Error ? cause.message : "",
    ].filter(Boolean).join(" | ");

    return {
      bodySample: message,
      configured,
      ok: false,
      responseTimeMs: Math.round(performance.now() - startedAt),
      statusText: "Request failed",
      url,
    };
  }
}
