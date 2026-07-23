#!/usr/bin/env node
/**
 * verify-design-tokens.cjs — verifier chặn tái phạm design token (AGENTS.md mục 5).
 *
 * HARD FAIL (exit 1) khi phát hiện trong app/, components/, lib/, styles.css:
 *   1. Hex "xanh rogue" đã bị khai tử (0A4BFF, 0057FF, 0f7cff, 0049d8, 0b74ff,
 *      145cff, 536fe8, 061b63, 0b246c, 062b5f, 102b62, 071b3e, 0b3a78, 2457e8, 637cf5)
 *   2. Utility thang màu gốc -blue-50..900 / -orange-50..700 (phải dùng primary-* / accent-*)
 *   3. rgba xanh rogue: rgba(0,87,255,...) / rgba(10,75,255,...)
 *
 * WARN (không fail): arbitrary hex màu khác trong className (bg-[#...], text-[#...] ...)
 * — nợ có chủ đích đang theo dõi (gradient khuyến mãi đỏ-cam, xanh lá about, #eef0f4 help).
 *
 * Chạy: npm run test:design-tokens
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_FILES = ["styles.css"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mjs", ".cjs"]);

// Ngoại lệ được phép (xem AGENTS.md — mục Chuẩn hóa token màu, điểm 7)
const ALLOWLIST = [
  "app/(site)/landing/[slug]/page.tsx", // landing template scoped, palette riêng có chủ ý
  "app/(payload)/admin-theme.css", // theme admin Payload, ngoài storefront
  "components/about/AboutRedesign.tsx", // khu redesign scoped — nợ P2
  "components/about/about-redesign.css" // khu redesign scoped — nợ P2
].map((p) => p.split("/").join(path.sep));

const ROGUE_HEX =
  /#(0a4bff|0057ff|0f7cff|0049d8|0b74ff|145cff|536fe8|061b63|0b246c|062b5f|102b62|071b3e|0b3a78|2457e8|637cf5)\b/i;
const RAW_SCALE =
  /-(?:blue-(?:50|100|200|300|400|500|600|700|800|900)|orange-(?:50|100|200|300|400|500|600|700))(?![0-9])/;
const ROGUE_RGBA = /rgba\(\s*(?:0\s*,\s*87\s*,\s*255|10\s*,\s*75\s*,\s*255)\s*,/i;
const ARBITRARY_COLOR =
  /(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|decoration)-\[#[0-9a-fA-F]{3,8}\]/g;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    const top = rel.split(path.sep)[0];
    if (["legacy", "scratch", "tmp", "public"].includes(top)) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(entry.name))) out.push(full);
  }
}

const files = [];
for (const d of SCAN_DIRS) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) walk(full, files);
}
for (const f of SCAN_FILES) {
  const full = path.join(ROOT, f);
  if (fs.existsSync(full)) files.push(full);
}

const failures = [];
const warnings = [];

for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (ALLOWLIST.some((a) => rel === a)) continue;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const loc = `${rel}:${i + 1}`;
    if (ROGUE_HEX.test(line)) failures.push(`${loc}  [hex xanh rogue]  ${line.trim().slice(0, 120)}`);
    if (RAW_SCALE.test(line)) failures.push(`${loc}  [-blue-*/-orange-* → dùng primary-*/accent-*]  ${line.trim().slice(0, 120)}`);
    if (ROGUE_RGBA.test(line)) failures.push(`${loc}  [rgba xanh rogue]  ${line.trim().slice(0, 120)}`);
    const arb = line.match(ARBITRARY_COLOR);
    if (arb) warnings.push(`${loc}  [arbitrary hex trong className]  ${arb.join(" ")}`);
  });
}

console.log(`\n== verify-design-tokens: quét ${files.length} file ==`);
if (warnings.length) {
  console.log(`\n⚠ WARN (${warnings.length}) — nợ arbitrary hex đang theo dõi (không fail):`);
  for (const w of warnings) console.log("  " + w);
}
if (failures.length) {
  console.error(`\n✖ FAIL (${failures.length}) — vi phạm token bị cấm:`);
  for (const f of failures) console.error("  " + f);
  console.error("\nQuy tắc: xanh thương hiệu = primary-* (chính primary-600), cam = accent-*.");
  console.error("Xem AGENTS.md mục 'Chuẩn hóa token màu'. Token khai ở app/globals.css @theme.");
  process.exit(1);
}
console.log(`\n✓ PASS — không còn hex xanh rogue / -blue-* / -orange-* ngoài allowlist. (WARN: ${warnings.length})`);
