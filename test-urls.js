const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

const paths = [
  "/",
  "/san-pham",
  "/tin-tuc",
  "/compare",
  "/lien-he",
  "/san-pham/may-scan-ricoh-ix1300-thiet-ke-nho-gon-hieu-suat-cao-ket-noi-linh-hoat",
  "/tin-tuc/cach-chon-may-scan-phu-hop-nam-2026",
];

async function checkUrl(path) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url);
  const ok = response.status >= 200 && response.status < 400;
  console.log(`${ok ? "PASS" : "FAIL"} ${response.status} ${url.href}`);
  return ok;
}

async function main() {
  const results = await Promise.all(paths.map((path) => checkUrl(path).catch((error) => {
    console.log(`FAIL ERR ${new URL(path, baseUrl).href} ${error.message}`);
    return false;
  })));

  if (results.some((ok) => !ok)) {
    process.exitCode = 1;
  }
}

main();
