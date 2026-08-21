import { Pool } from "pg";

/**
 * Tra cứu bảo hành công khai cho trang /tra-cuu-bao-hanh.
 *
 * Cố ý KHÔNG đi qua REST API của collection `warranties` (access read yêu cầu
 * đăng nhập) mà query trực tiếp Postgres với danh sách cột giới hạn — không
 * bao giờ trả SĐT khách hàng hay ghi chú nội bộ ra công khai.
 *
 * Quy tắc khớp:
 * - serial: so khớp CHÍNH XÁC, bỏ khoảng trắng, không phân biệt hoa/thường
 *   (tránh dò quét danh sách khách hàng bằng tiền tố serial).
 * - ehsmt: so khớp chính xác mã E-HSMT, bỏ khoảng trắng, không phân biệt
 *   hoa/thường — 1 gói thầu có thể trả nhiều thiết bị.
 * - customer: chứa chuỗi (ILIKE), yêu cầu tối thiểu 4 ký tự.
 *
 * Lỗi DB không được làm vỡ trang: trả ok=false để UI hiển thị thông báo
 * gián đoạn (nguyên tắc suy giảm mượt trong AGENTS.md mục 9).
 */

export type WarrantyLookupMode = "serial" | "customer" | "ehsmt";

export type WarrantyRecord = {
  id: number;
  serialNumber: string;
  customerName: string;
  ehsmtCode: string | null;
  sku: string | null;
  productName: string;
  startDate: string | null;
  endDate: string | null;
  warrantyMonths: number | null;
  voided: boolean;
};

export type WarrantyLookupResult = {
  ok: boolean;
  records: WarrantyRecord[];
};

export const WARRANTY_LOOKUP_MODES: WarrantyLookupMode[] = ["serial", "customer", "ehsmt"];

export const WARRANTY_LOOKUP_MIN_LENGTH: Record<WarrantyLookupMode, number> = {
  serial: 3,
  customer: 4,
  ehsmt: 4,
};

const LOOKUP_LIMIT = 50;

function databaseURL() {
  return (
    process.env.DATABASE_URI ||
    process.env.POSTGRES_URL ||
    (!process.env.VERCEL
      ? "postgres://payload:payload@127.0.0.1:5433/hpttech_payload"
      : undefined)
  );
}

let pgPool: Pool | undefined;

function getPgPool() {
  if (pgPool) return pgPool;
  const connectionString = databaseURL();
  if (!connectionString) return undefined;
  pgPool = new Pool({ connectionString, max: 5 });
  return pgPool;
}

export function isWarrantyLookupMode(value: string | undefined): value is WarrantyLookupMode {
  return value === "serial" || value === "customer" || value === "ehsmt";
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

type WarrantyRow = {
  id: number;
  serial_number: string;
  customer_name: string;
  ehsmt_code: string | null;
  sku: string | null;
  product_name: string;
  start_date: string | Date | null;
  end_date: string | Date | null;
  warranty_months: string | number | null;
  voided: boolean | null;
};

function toISOStringOrNull(value: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapRow(row: WarrantyRow): WarrantyRecord {
  const months = row.warranty_months === null ? null : Number(row.warranty_months);

  return {
    id: row.id,
    serialNumber: row.serial_number,
    customerName: row.customer_name,
    ehsmtCode: row.ehsmt_code,
    sku: row.sku,
    productName: row.product_name,
    startDate: toISOStringOrNull(row.start_date),
    endDate: toISOStringOrNull(row.end_date),
    warrantyMonths: months !== null && Number.isFinite(months) ? months : null,
    voided: Boolean(row.voided),
  };
}

export async function lookupWarranties(
  mode: WarrantyLookupMode,
  rawQuery: string,
): Promise<WarrantyLookupResult> {
  const query = rawQuery.trim();

  if (query.length < WARRANTY_LOOKUP_MIN_LENGTH[mode]) {
    return { ok: true, records: [] };
  }

  const pool = getPgPool();
  if (!pool) return { ok: false, records: [] };

  let whereClause: string;
  let param: string;

  if (mode === "serial") {
    whereClause = `upper(replace(w.serial_number, ' ', '')) = upper(replace($1, ' ', ''))`;
    param = query;
  } else if (mode === "ehsmt") {
    whereClause = `upper(replace(coalesce(w.ehsmt_code, ''), ' ', '')) = upper(replace($1, ' ', ''))`;
    param = query;
  } else {
    whereClause = `w.customer_name ilike $1`;
    param = `%${escapeLikePattern(query)}%`;
  }

  try {
    const result = await pool.query<WarrantyRow>(
      `
        select
          w.id,
          w.serial_number,
          w.customer_name,
          w.ehsmt_code,
          w.sku,
          w.product_name,
          w.start_date,
          w.end_date,
          w.warranty_months,
          w.voided
        from warranties w
        where ${whereClause}
        order by w.end_date desc nulls last, w.id desc
        limit ${LOOKUP_LIMIT}
      `,
      [param],
    );

    return { ok: true, records: result.rows.map(mapRow) };
  } catch (error) {
    console.error(
      `[warranty-lookup] Query failed: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`,
    );
    return { ok: false, records: [] };
  }
}
