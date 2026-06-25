/**
 * Script kiểm tra tốc độ load trang hpttech.vn
 * Đo TTFB (Time to First Byte) và tổng thời gian response
 */

const BASE_URL = "https://hpttech.vn";

const PAGES = [
  { name: "🏠 Trang chủ",          path: "/" },
  { name: "📦 Sản phẩm",           path: "/san-pham" },
  { name: "💡 Giải pháp",          path: "/giai-phap" },
  { name: "🏗️  Dự án",             path: "/du-an" },
  { name: "📰 Tin tức",             path: "/tin-tuc" },
  { name: "📋 Tuyển dụng",          path: "/tuyen-dung" },
  { name: "📞 Liên hệ",             path: "/lien-he" },
];

const RUNS = 3; // Số lần đo mỗi trang để lấy trung bình

function rating(ms) {
  if (ms < 800)  return { label: "✅ Tốt",    color: "\x1b[32m" };
  if (ms < 1800) return { label: "⚠️  Trung bình", color: "\x1b[33m" };
  return              { label: "❌ Chậm",   color: "\x1b[31m" };
}

async function measurePage(url) {
  const results = [];
  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
        },
        signal: AbortSignal.timeout(15000),
      });
      const ttfb = performance.now() - start;
      // Đọc hết body để đo total time
      const text = await res.text();
      const total = performance.now() - start;
      results.push({
        status: res.status,
        ttfb: Math.round(ttfb),
        total: Math.round(total),
        size: Math.round(text.length / 1024),
      });
    } catch (err) {
      results.push({ error: err.message });
    }
    // Delay nhỏ giữa các lần đo
    if (i < RUNS - 1) await new Promise(r => setTimeout(r, 500));
  }

  const valid = results.filter(r => !r.error);
  if (valid.length === 0) return { error: results[0].error };

  return {
    status:   valid[0].status,
    ttfb:     Math.round(valid.reduce((s, r) => s + r.ttfb, 0) / valid.length),
    total:    Math.round(valid.reduce((s, r) => s + r.total, 0) / valid.length),
    size:     valid[0].size,
    runs:     valid.length,
  };
}

const RESET = "\x1b[0m";
const BOLD  = "\x1b[1m";
const DIM   = "\x1b[2m";
const CYAN  = "\x1b[36m";

console.log(`\n${BOLD}${CYAN}════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}${CYAN}  🚀  HPT Tech – Kiểm tra tốc độ load trang             ${RESET}`);
console.log(`${BOLD}${CYAN}════════════════════════════════════════════════════════${RESET}`);
console.log(`${DIM}  Base URL : ${BASE_URL}`);
console.log(`  Số lần đo: ${RUNS} lần/trang (lấy trung bình)`);
console.log(`  Thời gian : ${new Date().toLocaleString("vi-VN")}${RESET}\n`);

const allResults = [];

for (const page of PAGES) {
  process.stdout.write(`  ${page.name.padEnd(22)} đang đo...`);
  const result = await measurePage(BASE_URL + page.path);

  if (result.error) {
    console.log(`\r  ${page.name.padEnd(22)} ❌ Lỗi: ${result.error}`);
    allResults.push({ ...page, error: result.error });
    continue;
  }

  const r = rating(result.total);
  console.log(
    `\r  ${page.name.padEnd(22)} ` +
    `${r.color}${r.label}${RESET}` +
    `  TTFB: ${BOLD}${String(result.ttfb).padStart(5)}ms${RESET}` +
    `  Total: ${BOLD}${String(result.total).padStart(5)}ms${RESET}` +
    `  ${DIM}${result.size} KB  HTTP ${result.status}${RESET}`
  );
  allResults.push({ ...page, ...result });
}

// Tổng kết
console.log(`\n${BOLD}${CYAN}════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}  📊 Tổng kết${RESET}`);
console.log(`${CYAN}════════════════════════════════════════════════════════${RESET}`);

const valid = allResults.filter(r => !r.error);
if (valid.length > 0) {
  const avgTotal = Math.round(valid.reduce((s, r) => s + r.total, 0) / valid.length);
  const avgTtfb  = Math.round(valid.reduce((s, r) => s + r.ttfb,  0) / valid.length);
  const slowest  = valid.reduce((a, b) => b.total > a.total ? b : a);
  const fastest  = valid.reduce((a, b) => b.total < a.total ? b : a);

  console.log(`  Trung bình TTFB  : ${BOLD}${avgTtfb}ms${RESET}`);
  console.log(`  Trung bình Total : ${BOLD}${avgTotal}ms${RESET}  ${rating(avgTotal).color}${rating(avgTotal).label}${RESET}`);
  console.log(`  Nhanh nhất : ${fastest.name} (${fastest.total}ms)`);
  console.log(`  Chậm nhất  : ${slowest.name} (${slowest.total}ms)`);
}

console.log(`\n${DIM}  Tiêu chuẩn đánh giá (thời gian load tổng):`)
console.log(`  ✅ Tốt      : < 800ms`)
console.log(`  ⚠️  Trung bình: 800ms – 1800ms`)
console.log(`  ❌ Chậm     : > 1800ms${RESET}\n`);
