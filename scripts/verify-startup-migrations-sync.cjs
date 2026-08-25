const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// Verifier chống lặp lại SỰ CỐ 26/08: PR thêm migration vào migrations/ nhưng
// KHÔNG thêm vào scripts/apply-startup-migrations.cjs.
//
// Repo có HAI cơ chế schema và chúng không tự đồng bộ:
//   - migrations/         → Payload CLI, dùng cho DB local (npm run payload -- migrate)
//   - apply-startup-migrations.cjs → khối SQL hardcode chạy mỗi lần container khởi
//     động (nixpacks [start] + Dockerfile CMD). ĐÂY là thứ quyết định schema PROD.
//
// Quên nửa thứ hai nghĩa là: prod thiếu cột → payload.find() trên collection đó lỗi
// → handlePayloadReadError nuốt lỗi (VERCEL_ENV không set trên VPS) → trang 404/rỗng
// im lặng. Đúng chuỗi đã làm sập toàn bộ landing danh mục.

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "migrations", "index.ts");
const startupPath = path.join(root, "scripts", "apply-startup-migrations.cjs");

const indexSource = fs.readFileSync(indexPath, "utf8");
const startupSource = fs.readFileSync(startupPath, "utf8");

// Tên migration trong migrations/index.ts: name: '20260826_031500_add_category_seo_content'
const declaredNames = [...indexSource.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);

assert.ok(
  declaredNames.length > 0,
  "Không đọc được tên migration nào từ migrations/index.ts — kiểm tra lại regex/định dạng file.",
);

const missing = declaredNames.filter((name) => !startupSource.includes(name));

if (missing.length) {
  console.error(
    [
      "",
      "✗ FAIL — migration có trong migrations/ nhưng CHƯA có trong scripts/apply-startup-migrations.cjs:",
      ...missing.map((name) => `    - ${name}`),
      "",
      "  Hậu quả nếu deploy: prod thiếu cột/bảng → payload.find() trên collection liên quan",
      "  lỗi → handlePayloadReadError nuốt lỗi → trang liên quan 404/rỗng IM LẶNG.",
      "",
      "  Cách sửa: thêm vào scripts/apply-startup-migrations.cjs một khối theo mẫu có sẵn",
      "  (const <ten>MigrationName, const <ten>SQL với INSERT vào payload_migrations,",
      "  async function apply<Ten>, rồi gọi trong main()).",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

// Mỗi migration được đăng ký phải thực sự ĐƯỢC GỌI trong main(), không chỉ khai báo.
const mainBody = startupSource.slice(startupSource.indexOf("async function main("));
const applyCalls = [...mainBody.matchAll(/await\s+(apply[A-Za-z0-9_]*)\s*\(\s*client\s*\)/g)].map(
  (m) => m[1],
);
const declaredApplyFns = [...startupSource.matchAll(/async function (apply[A-Za-z0-9_]*)\s*\(/g)].map(
  (m) => m[1],
);
const neverCalled = declaredApplyFns.filter((fn) => !applyCalls.includes(fn));

assert.deepEqual(
  neverCalled,
  [],
  `Hàm migration khai báo nhưng không được gọi trong main(): ${neverCalled.join(", ")}`,
);

console.log(
  `Startup migrations sync OK — ${declaredNames.length} migration đã đăng ký, ${applyCalls.length} hàm được gọi trong main().`,
);
