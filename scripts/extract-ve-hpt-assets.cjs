#!/usr/bin/env node
/**
 * Giai ma cac asset base64 cua trang Ve HPT thanh file that trong public/ve-hpt/.
 * Chay tu dong qua "predev" / "prebuild" (npm lifecycle). Idempotent — chi ghi khi thieu/khac size.
 */
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "ve-hpt-assets-data.json");
const OUT = path.join(__dirname, "..", "public", "ve-hpt");

const assets = JSON.parse(fs.readFileSync(DATA, "utf8"));
fs.mkdirSync(OUT, { recursive: true });

let written = 0, skipped = 0, bytes = 0;
for (const [name, b64] of Object.entries(assets)) {
  const buf = Buffer.from(b64, "base64");
  const file = path.join(OUT, name);
  if (fs.existsSync(file) && fs.statSync(file).size === buf.length) { skipped++; continue; }
  fs.writeFileSync(file, buf);
  written++; bytes += buf.length;
}
console.log(`[ve-hpt-assets] ${written} file ghi moi (${Math.round(bytes/1024)}KB), ${skipped} bo qua — public/ve-hpt/`);
