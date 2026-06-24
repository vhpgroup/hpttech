const { readFileSync } = require("node:fs");
const { createSign } = require("node:crypto");
const path = require("node:path");
const { Client } = require("pg");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const DEFAULT_SHEET_TITLE =
  process.env.GOOGLE_PRICE_SHEET_TITLE || "Bang gia san pham";

const SHEET_HEADERS = [
  "productId",
  "variantId",
  "offerId",
  "sku",
  "Ten san pham",
  "Danh muc",
  "Gia ban",
  "Gia niem yet",
  "Ma giam gia",
  "Trang thai ban",
  "Ghi chu",
];

function trimEnv(value) {
  return String(value || "").trim();
}

function sheetId() {
  const value = trimEnv(process.env.GOOGLE_PRICE_SHEET_ID);
  if (!value) throw new Error("Missing GOOGLE_PRICE_SHEET_ID.");
  return value;
}

function databaseUri() {
  const value = trimEnv(process.env.DATABASE_URI || process.env.POSTGRES_URL);
  if (!value) throw new Error("Missing DATABASE_URI or POSTGRES_URL.");
  return value;
}

function integerArg(name) {
  const raw = process.argv
    .slice(3)
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`--${name} must be a non-negative integer.`);
  }
  return value;
}

function loadGoogleServiceAccount() {
  const jsonEnv = trimEnv(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (jsonEnv) {
    const account = JSON.parse(jsonEnv);
    validateServiceAccount(account);
    return account;
  }

  const fileEnv = trimEnv(process.env.GOOGLE_SERVICE_ACCOUNT_FILE);
  if (fileEnv) {
    const filePath = path.isAbsolute(fileEnv)
      ? fileEnv
      : path.resolve(process.cwd(), fileEnv);
    const account = JSON.parse(readFileSync(filePath, "utf8"));
    validateServiceAccount(account);
    return account;
  }

  throw new Error(
    "Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_FILE.",
  );
}

function validateServiceAccount(account) {
  if (account.type !== "service_account") {
    throw new Error("Google credential is not a service account.");
  }
  if (!account.client_email || !account.private_key || !account.token_uri) {
    throw new Error("Google service account is missing required fields.");
  }
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function googleAccessToken(scope) {
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

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Google token response missing access_token.");
  }
  return data.access_token;
}

async function googleSheetsFetch(endpoint, init = {}) {
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

  if (response.status === 204) return undefined;
  return response.json();
}

async function ensureSpreadsheetSheet(spreadsheetId, title) {
  const metadata = await googleSheetsFetch(`spreadsheets/${spreadsheetId}`);
  const existing = metadata.sheets?.find(
    (sheet) => sheet.properties?.title === title,
  );
  if (existing?.properties?.sheetId !== undefined) {
    return existing.properties.sheetId;
  }

  const created = await googleSheetsFetch(
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

async function readSpreadsheetValues(spreadsheetId, title) {
  const data = await googleSheetsFetch(
    `spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}`,
  );
  return data.values || [];
}

async function writeSpreadsheetValues(spreadsheetId, data) {
  if (!data.length) return;

  await googleSheetsFetch(`spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    body: JSON.stringify({
      data: data.map((item) => ({
        majorDimension: "ROWS",
        range: item.range,
        values: item.values,
      })),
      valueInputOption: "RAW",
    }),
    method: "POST",
  });
}

async function appendSpreadsheetValues(spreadsheetId, title, values) {
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

async function deleteSpreadsheetRows(spreadsheetId, googleSheetId, rowIndexes) {
  if (!rowIndexes.length) return;

  const sorted = [...rowIndexes].sort((left, right) => right - left);
  await googleSheetsFetch(`spreadsheets/${spreadsheetId}:batchUpdate`, {
    body: JSON.stringify({
      requests: sorted.map((rowIndex) => ({
        deleteDimension: {
          range: {
            dimension: "ROWS",
            endIndex: rowIndex + 1,
            sheetId: googleSheetId,
            startIndex: rowIndex,
          },
        },
      })),
    }),
    method: "POST",
  });
}

async function formatSpreadsheetSheet(spreadsheetId, googleSheetId, columnCount) {
  await googleSheetsFetch(`spreadsheets/${spreadsheetId}:batchUpdate`, {
    body: JSON.stringify({
      requests: [
        {
          updateSheetProperties: {
            fields: "gridProperties.frozenRowCount",
            properties: {
              gridProperties: {
                frozenRowCount: 1,
              },
              sheetId: googleSheetId,
            },
          },
        },
        {
          setBasicFilter: {
            filter: {
              range: {
                endColumnIndex: columnCount,
                sheetId: googleSheetId,
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
              sheetId: googleSheetId,
              startIndex: 0,
            },
          },
        },
      ],
    }),
    method: "POST",
  });
}

function docText(doc, key) {
  return doc && typeof doc === "object" && key in doc ? String(doc[key] || "") : "";
}

function relationID(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && "id" in value) return value.id;
  return undefined;
}

function formatVnd(value) {
  if (value === undefined || !Number.isFinite(value)) return "";
  return `${Math.round(value).toLocaleString("vi-VN")}d`;
}

function parsePriceInput(value) {
  const text = String(value || "").trim();
  if (!text) return { isContact: false, value: undefined };

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/\b(lien he|call|contact)\b/.test(normalized)) {
    return { isContact: true, value: undefined };
  }

  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return { isContact: false, value: undefined };
  const parsed = Number(digits);
  return Number.isFinite(parsed)
    ? { isContact: false, value: parsed }
    : { isContact: false, value: undefined };
}

function normalizeSaleStatus(value, isContact, hasNumericPrice) {
  if (hasNumericPrice && !isContact) return "active";

  const text = String(value || "").trim().toLowerCase();
  if (!text) return isContact ? "contact" : "active";
  if (
    text === "active" ||
    text === "contact" ||
    text === "paused" ||
    text === "discontinued"
  ) {
    return text;
  }
  if (text.includes("lien he") || text.includes("contact")) return "contact";
  if (text.includes("pause") || text.includes("tam")) return "paused";
  if (text.includes("ngung") || text.includes("discontinued")) {
    return "discontinued";
  }
  return isContact ? "contact" : "active";
}

function choosePrimaryVariant(variants) {
  return (
    variants.find(
      (variant) => variant.isPrimary === true && variant.status === "active",
    ) ||
    variants.find((variant) => variant.status === "active") ||
    variants.find((variant) => variant.isPrimary === true) ||
    variants[0]
  );
}

function chooseCurrentOffer(offers) {
  return (
    offers.find(
      (offer) =>
        offer.saleStatus === "active" || offer.saleStatus === "contact",
    ) || offers[0]
  );
}

async function withDb(callback) {
  const client = new Client({ connectionString: databaseUri() });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function postRevalidate(payload) {
  const baseURL =
    process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!baseURL || !secret) return;

  const url = baseURL.startsWith("http") ? baseURL : `https://${baseURL}`;

  try {
    const response = await fetch(`${url}/api/revalidate`, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      method: "POST",
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`[price-sheet-sync] revalidate failed: ${response.status} ${body}`);
    }
  } catch (error) {
    console.warn("[price-sheet-sync] revalidate request failed", error);
  }
}

async function loadPriceContext(client) {
  const productsResult = await client.query(`
    select
      p.id,
      p.title,
      p.name,
      p.sku,
      p.price,
      p.compare_at_price as "compareAtPrice",
      p.discount_badge as "discountBadge",
      p.updated_at as "updatedAt",
      json_build_object('id', c.id, 'name', c.name) as category
    from products p
    left join categories c on c.id = p.category_id
    order by coalesce(p.title, p.name, '') asc, p.id asc
  `);

  const variantsResult = await client.query(`
    select
      id,
      sku,
      product_id as product,
      variant_name as "variantName",
      is_primary as "isPrimary",
      status
    from product_variants
    order by is_primary desc nulls last, id asc
  `);

  const offersResult = await client.query(`
    select
      id,
      variant_id as variant,
      price,
      currency,
      vat_rate as "vatRate",
      vat_included as "vatIncluded",
      promotion_price as "promotionPrice",
      sale_status as "saleStatus"
    from product_offers
    order by id asc
  `);

  return {
    offers: offersResult.rows.map((offer) => ({
      ...offer,
      price: offer.price === null ? undefined : Number(offer.price),
      promotionPrice:
        offer.promotionPrice === null ? undefined : Number(offer.promotionPrice),
      vatRate: offer.vatRate === null ? undefined : Number(offer.vatRate),
    })),
    products: productsResult.rows,
    variants: variantsResult.rows,
  };
}

function offerDisplayValues(offer, product) {
  const regularPrice =
    typeof offer?.price === "number" &&
    Number.isFinite(offer.price) &&
    offer.price > 0
      ? offer.price
      : undefined;
  const promotionPrice =
    typeof offer?.promotionPrice === "number" &&
    Number.isFinite(offer.promotionPrice) &&
    offer.promotionPrice > 0
      ? offer.promotionPrice
      : undefined;
  const displayPrice = promotionPrice ?? regularPrice;
  const compareAtPrice =
    promotionPrice !== undefined && regularPrice !== undefined
      ? regularPrice
      : undefined;
  const saleStatus =
    typeof offer?.saleStatus === "string" ? String(offer.saleStatus) : "active";

  return {
    compareAtPrice:
      compareAtPrice !== undefined
        ? String(compareAtPrice)
        : docText(product, "compareAtPrice"),
    price:
      displayPrice !== undefined ? String(displayPrice) : docText(product, "price"),
    saleStatus,
  };
}

function buildExportRow(product, variants, offers) {
  const productId = relationID(product.id);
  if (productId === undefined) return undefined;

  const productVariants = variants.filter(
    (variant) => relationID(variant.product) === productId,
  );
  const variant = choosePrimaryVariant(productVariants);
  const variantId = relationID(variant?.id);
  const offer = chooseCurrentOffer(
    offers.filter((item) => relationID(item.variant) === variantId),
  );
  const displayValues = offerDisplayValues(offer, product);

  const values = [
    String(productId),
    variantId === undefined ? "" : String(variantId),
    relationID(offer?.id) === undefined ? "" : String(relationID(offer?.id)),
    docText(variant, "sku") || docText(product, "sku"),
    docText(product, "title") || docText(product, "name"),
    docText(product.category, "name"),
    displayValues.price,
    displayValues.compareAtPrice,
    docText(product, "discountBadge"),
    displayValues.saleStatus || "active",
    "",
  ];

  return {
    compareAtPrice: values[7],
    discountBadge: values[8],
    offerId: values[2],
    price: values[6],
    productId: values[0],
    saleStatus: values[9],
    sku: values[3],
    title: values[4],
    values,
    variantId: values[1],
  };
}

function exportedRowsFromProducts(products, variants, offers) {
  return products
    .map((product) => buildExportRow(product, variants, offers))
    .filter(Boolean);
}

function rowsFromSheet(values) {
  if (values.length < 2) return [];
  const [header, ...body] = values;
  const index = new Map(header.map((name, idx) => [String(name).trim(), idx]));

  return body
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) => ({
      compareAtPrice: row[index.get("Gia niem yet") || 0] || "",
      discountBadge: row[index.get("Ma giam gia") || 0] || "",
      offerId: row[index.get("offerId") || 0] || "",
      price: row[index.get("Gia ban") || 0] || "",
      productId: row[index.get("productId") || 0] || "",
      saleStatus: row[index.get("Trang thai ban") || 0] || "",
      sku: row[index.get("sku") || 0] || "",
      title: row[index.get("Ten san pham") || 0] || "",
      variantId: row[index.get("variantId") || 0] || "",
    }));
}

function normalizeComparableValue(value) {
  return String(value || "").trim();
}

function normalizePriceText(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/\b(lien he|call|contact)\b/.test(normalized)) return "contact";

  const digits = text.replace(/[^\d]/g, "");
  return digits || text;
}

function exportedRowChanged(existing, next) {
  return (
    normalizeComparableValue(existing.variantId) !==
      normalizeComparableValue(next.variantId) ||
    normalizeComparableValue(existing.offerId) !==
      normalizeComparableValue(next.offerId) ||
    normalizeComparableValue(existing.sku) !== normalizeComparableValue(next.sku) ||
    normalizeComparableValue(existing.title) !==
      normalizeComparableValue(next.title) ||
    normalizeComparableValue(existing.price) !==
      normalizeComparableValue(next.price) ||
    normalizeComparableValue(existing.compareAtPrice) !==
      normalizeComparableValue(next.compareAtPrice) ||
    normalizeComparableValue(existing.discountBadge) !==
      normalizeComparableValue(next.discountBadge) ||
    normalizeComparableValue(existing.saleStatus) !==
      normalizeComparableValue(next.saleStatus)
  );
}

function productKey(row) {
  const productId = String(row.productId || "").trim();
  if (productId) return `product:${productId}`;
  const sku = String(row.sku || "").trim().toLowerCase();
  return sku ? `sku:${sku}` : "";
}

function rowNumberToA1(rowNumber) {
  return `${rowNumber}:${rowNumber}`;
}

async function exportToSheet() {
  const spreadsheetId = sheetId();
  const limit = integerArg("limit");

  return withDb(async (client) => {
    const { offers, products, variants } = await loadPriceContext(client);
    const selectedProducts =
      limit === undefined ? products : products.slice(0, limit);
    const exportedRows = exportedRowsFromProducts(
      selectedProducts,
      variants,
      offers,
    );
    const googleSheetId = await ensureSpreadsheetSheet(
      spreadsheetId,
      DEFAULT_SHEET_TITLE,
    );
    const currentValues = await readSpreadsheetValues(
      spreadsheetId,
      DEFAULT_SHEET_TITLE,
    );
    const currentRows = rowsFromSheet(currentValues);
    const currentKeys = new Map();

    currentRows.forEach((row, index) => {
      const key = productKey(row);
      if (!key) return;
      currentKeys.set(key, {
        row,
        rowNumber: index + 2,
      });
    });

    let ensuredHeader = false;
    const updates = [];
    const appends = [];
    const seenKeys = new Set();
    let updated = 0;

    for (const row of exportedRows) {
      const key = productKey(row);
      if (!key) continue;
      seenKeys.add(key);
      const existing = currentKeys.get(key);

      if (!existing) {
        appends.push(row.values);
        continue;
      }

      if (!exportedRowChanged(existing.row, row)) continue;
      updates.push({
        range: `${DEFAULT_SHEET_TITLE}!${rowNumberToA1(existing.rowNumber)}`,
        values: [row.values],
      });
      updated += 1;
    }

    const rowIndexesToDelete =
      limit === undefined
        ? [...currentKeys.entries()]
            .filter(([key]) => !seenKeys.has(key))
            .map(([, value]) => value.rowNumber - 1)
        : [];

    if (
      currentValues.length === 0 ||
      currentValues[0].join("||") !== SHEET_HEADERS.join("||")
    ) {
      ensuredHeader = true;
      updates.unshift({
        range: `${DEFAULT_SHEET_TITLE}!1:1`,
        values: [SHEET_HEADERS],
      });
    }

    await writeSpreadsheetValues(spreadsheetId, updates);
    await appendSpreadsheetValues(spreadsheetId, DEFAULT_SHEET_TITLE, appends);
    await deleteSpreadsheetRows(spreadsheetId, googleSheetId, rowIndexesToDelete);
    await formatSpreadsheetSheet(
      spreadsheetId,
      googleSheetId,
      SHEET_HEADERS.length,
    );

    console.log(
      JSON.stringify(
        {
          appended: appends.length,
          deleted: rowIndexesToDelete.length,
          ensuredHeader,
          exported: exportedRows.length,
          limit: limit ?? null,
          sheetId: spreadsheetId,
          sheetTitle: DEFAULT_SHEET_TITLE,
          updated,
        },
        null,
        2,
      ),
    );
  });
}

function sameNumber(left, right) {
  return left === right;
}

function sameText(left, right) {
  return normalizeComparableValue(left) === normalizeComparableValue(right);
}

async function importFromSheet() {
  const spreadsheetId = sheetId();
  const values = await readSpreadsheetValues(spreadsheetId, DEFAULT_SHEET_TITLE);
  const rows = rowsFromSheet(values);

  return withDb(async (client) => {
    const { offers, products, variants } = await loadPriceContext(client);
    const productsById = new Map(
      products
        .map((product) => [String(relationID(product.id) || ""), product])
        .filter(([id]) => Boolean(id)),
    );
    const productsBySku = new Map(
      products
        .map((product) => [docText(product, "sku"), product])
        .filter(([sku]) => Boolean(sku)),
    );

    let skipped = 0;
    let updated = 0;

    for (const row of rows) {
      const price = parsePriceInput(row.price);
      const listPrice = parsePriceInput(row.compareAtPrice);
      const saleStatus = normalizeSaleStatus(
        row.saleStatus,
        price.isContact || listPrice.isContact,
        price.value !== undefined,
      );
      const product =
        productsById.get(String(row.productId).trim()) ||
        productsBySku.get(String(row.sku).trim());

      if (!product?.id) {
        skipped += 1;
        continue;
      }

      const productId = relationID(product.id);
      const variant = choosePrimaryVariant(
        variants.filter((item) => relationID(item.product) === productId),
      );
      const existingOffer =
        offers.find(
          (offer) => String(relationID(offer.id) || "") === String(row.offerId),
        ) ||
        chooseCurrentOffer(
          offers.filter(
            (offer) => relationID(offer.variant) === relationID(variant?.id),
          ),
        );

      let regularPrice = price.value;
      let promotionPrice = null;
      let compareAtText = "";

      if (
        saleStatus !== "contact" &&
        price.value !== undefined &&
        listPrice.value !== undefined &&
        listPrice.value > price.value
      ) {
        regularPrice = listPrice.value;
        promotionPrice = price.value;
        compareAtText = formatVnd(listPrice.value);
      } else if (saleStatus !== "contact" && price.value !== undefined) {
        regularPrice = price.value;
      }

      const productPriceText =
        saleStatus === "contact"
          ? "Lien he"
          : promotionPrice !== null
            ? formatVnd(promotionPrice)
            : formatVnd(price.value);

      const currentOfferValues = offerDisplayValues(existingOffer, product);
      const productNeedsUpdate =
        !sameText(docText(product, "discountBadge"), row.discountBadge.trim()) ||
        normalizePriceText(docText(product, "compareAtPrice")) !==
          normalizePriceText(compareAtText) ||
        normalizePriceText(docText(product, "price")) !==
          normalizePriceText(productPriceText);
      const nextOfferPrice = saleStatus === "contact" ? 0 : regularPrice || 0;
      const currentPromotionPrice =
        typeof existingOffer?.promotionPrice === "number"
          ? existingOffer.promotionPrice
          : undefined;
      const nextPromotionPrice =
        promotionPrice === null ? undefined : promotionPrice;
      const offerNeedsUpdate =
        Boolean(variant?.id) &&
        (!sameText(currentOfferValues.saleStatus, saleStatus) ||
          !sameNumber(
            typeof existingOffer?.price === "number"
              ? existingOffer.price
              : undefined,
            nextOfferPrice,
          ) ||
          !sameNumber(currentPromotionPrice, nextPromotionPrice));

      if (!productNeedsUpdate && !offerNeedsUpdate) {
        skipped += 1;
        continue;
      }

      await client.query("begin");
      try {
        if (productNeedsUpdate) {
          await client.query(
            `
              update products
              set
                compare_at_price = $1,
                discount_badge = $2,
                price = $3,
                updated_at = now()
              where id = $4
            `,
            [
              compareAtText,
              row.discountBadge.trim(),
              productPriceText,
              product.id,
            ],
          );
        }

        if (variant?.id && offerNeedsUpdate) {
          const offerValues = [
            relationID(variant.id),
            nextOfferPrice,
            docText(existingOffer, "currency") || "VND",
            typeof existingOffer?.vatRate === "number" &&
            Number.isFinite(existingOffer.vatRate)
              ? existingOffer.vatRate
              : 10,
            typeof existingOffer?.vatIncluded === "boolean"
              ? existingOffer.vatIncluded
              : true,
            promotionPrice,
            saleStatus,
          ];

          if (existingOffer?.id !== undefined) {
            await client.query(
              `
                update product_offers
                set
                  variant_id = $1,
                  price = $2,
                  currency = $3,
                  vat_rate = $4,
                  vat_included = $5,
                  promotion_price = $6,
                  sale_status = $7,
                  updated_at = now()
                where id = $8
              `,
              [...offerValues, existingOffer.id],
            );
          } else {
            await client.query(
              `
                insert into product_offers (
                  variant_id,
                  price,
                  currency,
                  vat_rate,
                  vat_included,
                  promotion_price,
                  sale_status,
                  created_at,
                  updated_at
                )
                values ($1, $2, $3, $4, $5, $6, $7, now(), now())
              `,
              offerValues,
            );
          }
        }

        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw new Error(
          [
            `Offer sync failed for productId=${String(productId || "")}`,
            `sku=${row.sku}`,
            `title=${row.title}`,
            `price=${row.price}`,
            `compareAtPrice=${row.compareAtPrice}`,
            `saleStatus=${saleStatus}`,
            `regularPrice=${String(regularPrice ?? "")}`,
            `promotionPrice=${String(promotionPrice ?? "")}`,
            error instanceof Error ? error.message : String(error),
          ].join(" | "),
        );
      }

      updated += 1;
    }

    if (updated > 0) {
      await postRevalidate({ collection: "products" });
    }

    console.log(
      JSON.stringify(
        {
          imported: rows.length,
          revalidated: updated > 0,
          skipped,
          updated,
        },
        null,
        2,
      ),
    );
  });
}

async function syncSheet() {
  await importFromSheet();
  await exportToSheet();
}

async function main() {
  const mode = process.argv[2];
  if (mode === "export") {
    await exportToSheet();
    return;
  }
  if (mode === "import") {
    await importFromSheet();
    return;
  }
  if (mode === "sync") {
    await syncSheet();
    return;
  }
  throw new Error("Usage: node scripts/sync-price-sheet.cjs <export|import|sync>");
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
