import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import path from "node:path";

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
  token_uri: string;
  type: string;
};

type GoogleSheet = {
  properties?: {
    sheetId?: number;
    title?: string;
  };
};

type SpreadsheetMetadata = {
  properties?: {
    title?: string;
  };
  sheets?: GoogleSheet[];
};

type BatchUpdateResponse = {
  replies?: Array<{
    addSheet?: {
      properties?: {
        sheetId?: number;
        title?: string;
      };
    };
  }>;
};

function trimEnv(value?: string | null) {
  return String(value || "").trim();
}

export function loadGoogleServiceAccount() {
  const jsonEnv = trimEnv(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (jsonEnv) {
    const account = JSON.parse(jsonEnv) as GoogleServiceAccount;
    validateServiceAccount(account);
    return account;
  }

  const fileEnv = trimEnv(process.env.GOOGLE_SERVICE_ACCOUNT_FILE);
  if (fileEnv) {
    const filePath = path.isAbsolute(fileEnv)
      ? fileEnv
      : path.resolve(process.cwd(), fileEnv);
    const account = JSON.parse(
      readFileSync(filePath, "utf8"),
    ) as GoogleServiceAccount;
    validateServiceAccount(account);
    return account;
  }

  throw new Error(
    "Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_FILE.",
  );
}

function validateServiceAccount(account: GoogleServiceAccount) {
  if (account.type !== "service_account") {
    throw new Error("Google credential is not a service account.");
  }
  if (!account.client_email || !account.private_key || !account.token_uri) {
    throw new Error("Google service account is missing required fields.");
  }
}

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function googleAccessToken(scope: string) {
  const account = loadGoogleServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: account.client_email,
    scope,
    aud: account.token_uri,
    exp: now + 3600,
    iat: now,
  };
  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claimSet))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer
    .sign(account.private_key, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch(account.token_uri, {
    body: new URLSearchParams({
      assertion,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google token request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google token response missing access_token.");
  }
  return data.access_token;
}

async function googleSheetsFetch<T>(
  endpoint: string,
  init: RequestInit = {},
) {
  const token = await googleAccessToken(
    "https://www.googleapis.com/auth/spreadsheets",
  );
  const response = await fetch(`https://sheets.googleapis.com/v4/${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Sheets request failed: ${response.status} ${body}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function ensureSpreadsheetSheet(
  spreadsheetId: string,
  title: string,
) {
  const metadata = await googleSheetsFetch<SpreadsheetMetadata>(
    `spreadsheets/${spreadsheetId}`,
  );
  const existing = metadata.sheets?.find(
    (sheet) => sheet.properties?.title === title,
  );
  if (existing?.properties?.sheetId !== undefined) {
    return existing.properties.sheetId;
  }

  const created = await googleSheetsFetch<BatchUpdateResponse>(
    `spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title },
            },
          },
        ],
      }),
      method: "POST",
    },
  );

  const createdSheetId = created.replies?.[0]?.addSheet?.properties?.sheetId;
  if (createdSheetId === undefined) {
    throw new Error(`Failed to create Google Sheet tab "${title}".`);
  }
  return createdSheetId;
}

export async function replaceSpreadsheetValues(
  spreadsheetId: string,
  title: string,
  values: string[][],
) {
  await googleSheetsFetch(
    `spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}:clear`,
    {
      body: "{}",
      method: "POST",
    },
  );

  await googleSheetsFetch(
    `spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}!A1?valueInputOption=RAW`,
    {
      body: JSON.stringify({
        majorDimension: "ROWS",
        values,
      }),
      method: "PUT",
    },
  );
}

export async function readSpreadsheetValues(
  spreadsheetId: string,
  title: string,
) {
  const data = await googleSheetsFetch<{ values?: string[][] }>(
    `spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}`,
  );
  return data.values || [];
}

export async function formatSpreadsheetSheet(
  spreadsheetId: string,
  sheetId: number,
  columnCount: number,
) {
  await googleSheetsFetch(
    `spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      body: JSON.stringify({
        requests: [
          {
            updateSheetProperties: {
              fields: "gridProperties.frozenRowCount",
              properties: {
                gridProperties: {
                  frozenRowCount: 1,
                },
                sheetId,
              },
            },
          },
          {
            setBasicFilter: {
              filter: {
                range: {
                  endColumnIndex: columnCount,
                  sheetId,
                  startRowIndex: 0,
                },
              },
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                dimension: "COLUMNS",
                endIndex: columnCount,
                sheetId,
                startIndex: 0,
              },
            },
          },
        ],
      }),
      method: "POST",
    },
  );
}

export async function getSpreadsheetMetadata(spreadsheetId: string) {
  return googleSheetsFetch<SpreadsheetMetadata>(`spreadsheets/${spreadsheetId}`);
}

export async function writeSpreadsheetValues(
  spreadsheetId: string,
  data: Array<{ range: string; values: string[][] }>,
) {
  if (!data.length) return;

  await googleSheetsFetch(
    `spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      body: JSON.stringify({
        data: data.map((item) => ({
          majorDimension: "ROWS",
          range: item.range,
          values: item.values,
        })),
        valueInputOption: "RAW",
      }),
      method: "POST",
    },
  );
}

export async function appendSpreadsheetValues(
  spreadsheetId: string,
  title: string,
  values: string[][],
) {
  if (!values.length) return;

  await googleSheetsFetch(
    `spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      body: JSON.stringify({
        majorDimension: "ROWS",
        values,
      }),
      method: "POST",
    },
  );
}

export async function deleteSpreadsheetRows(
  spreadsheetId: string,
  sheetId: number,
  rowIndexes: number[],
) {
  if (!rowIndexes.length) return;

  const sorted = [...rowIndexes].sort((left, right) => right - left);
  await googleSheetsFetch(
    `spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      body: JSON.stringify({
        requests: sorted.map((rowIndex) => ({
          deleteDimension: {
            range: {
              dimension: "ROWS",
              endIndex: rowIndex + 1,
              sheetId,
              startIndex: rowIndex,
            },
          },
        })),
      }),
      method: "POST",
    },
  );
}
