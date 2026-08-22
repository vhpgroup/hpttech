#!/usr/bin/env node
/**
 * Giai ma bo favicon vuong (base64) thanh file that trong public/.
 * Chay tu dong qua "predev" / "prebuild" (npm lifecycle). Idempotent — chi ghi khi thieu/khac size.
 *
 * Vi sao can bo icon rieng thay vi dung thang assets/logo/hptlogo.png:
 * Google chi chap nhan favicon HINH VUONG va co canh la boi so cua 48px.
 * hptlogo.png la logo ngang 1661x1007 (~624KB) nen Google tu choi va hien icon qua dia cau mac dinh.
 * Bo icon duoi day cat rieng khoi chu "HPT" (bo dong chu "TECHNOLOGY" vi khong the doc o 16px),
 * dat giua khung vuong nen trang — doc ro o ca giao dien sang lan toi.
 */
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "favicon-assets-data.json");
const PUBLIC = path.join(__dirname, "..", "public");

const assets = JSON.parse(fs.readFileSync(DATA, "utf8"));

let written = 0, skipped = 0, bytes = 0;
for (const [rel, b64] of Object.entries(assets)) {
  const buf = Buffer.from(b64, "base64");
  const file = path.join(PUBLIC, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && fs.statSync(file).size === buf.length) { skipped++; continue; }
  fs.writeFileSync(file, buf);
  written++; bytes += buf.length;
}
console.log(`[favicon-assets] ${written} file ghi moi (${Math.round(bytes/1024)}KB), ${skipped} bo qua — public/`);
