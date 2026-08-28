import { type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

const IOT_CODE = "iot";

/**
 * Thêm loại catalog IoT độc lập với "networking".
 *
 * `specProfile` chưa có một bộ cột cố định ở giai đoạn này. Sản phẩm IoT dùng
 * `specs[]` chuẩn hóa từ nguồn, nên enum vẫn cần chứa `iot` để profile được lưu
 * và hiển thị đúng trong Payload Admin.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql.raw(`ALTER TYPE "public"."enum_product_types_code" ADD VALUE IF NOT EXISTS '${IOT_CODE}';`),
  );
  await db.execute(
    sql.raw(`ALTER TYPE "public"."enum_products_spec_profile" ADD VALUE IF NOT EXISTS '${IOT_CODE}';`),
  );
  await db.execute(
    sql.raw(`ALTER TYPE "public"."enum__products_v_version_spec_profile" ADD VALUE IF NOT EXISTS '${IOT_CODE}';`),
  );
}

// PostgreSQL không hỗ trợ xóa riêng một enum value một cách an toàn. Giữ no-op để
// rollback không làm hỏng product type hoặc các sản phẩm IoT đã được tạo.
export async function down(): Promise<void> {}