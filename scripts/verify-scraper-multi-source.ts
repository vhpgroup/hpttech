import assert from "node:assert/strict";
import {
  mergeExtractedProducts,
  extractProductFromUrl,
} from "../lib/scraper/extractor";
import { selectProductSources } from "../lib/scraper/tavily-searcher";
import type { TavilySearchResult } from "../lib/scraper/types";

async function main() {
  const candidates: TavilySearchResult[] = [
    {
      domain: "phucanh.vn",
      isManufacturer: false,
      score: 0.82,
      sourceType: "retailer",
      title: "Brother ADS-4700W",
      url: "https://phucanh.vn/brother-ads-4700w.html",
    },
    {
      domain: "brother.com.vn",
      isManufacturer: true,
      score: 0.75,
      sourceType: "manufacturer",
      title: "ADS-4700W",
      url: "https://brother.com.vn/ads-4700w",
    },
    {
      domain: "vietbis.vn",
      isManufacturer: false,
      score: 0.95,
      sourceType: "retailer",
      title: "Brother ADS-4700W",
      url: "https://vietbis.vn/ads-4700w",
    },
  ];

  assert.deepEqual(
    selectProductSources(candidates, "Brother ADS-4700W").map(
      (source) => source.domain,
    ),
    ["brother.com.vn", "phucanh.vn", "vietbis.vn"],
  );

  assert.deepEqual(
    selectProductSources(
      [
        {
          domain: "brother.com.vn",
          isManufacturer: true,
          score: 0.99,
          sourceType: "manufacturer",
          title: "ADS-4300N | Brother Việt Nam",
          url: "https://brother.com.vn/scanners/ads-4300n",
        },
        {
          domain: "anphatpc.com.vn",
          isManufacturer: false,
          score: 0.8,
          sourceType: "retailer",
          title: "Máy Scan Brother ADS-3000N",
          url: "https://anphatpc.com.vn/may-scan-brother-ads-3000n.html",
        },
      ],
      "Máy Scan Brother ADS-3000N",
    ).map((source) => source.url),
    ["https://anphatpc.com.vn/may-scan-brother-ads-3000n.html"],
  );

  assert.deepEqual(
    selectProductSources(
      [
        {
          domain: "brother.com.vn",
          isManufacturer: true,
          score: 0.99,
          sourceType: "manufacturer",
          title: "ADS-4300N | Brother Việt Nam",
          url: "https://brother.com.vn/scanners/ads-4300n",
        },
      ],
      "Máy Scan Brother ADS-2700W",
    ),
    [],
  );

  const official = await extractProductFromUrl(
    "https://brother.com.vn/ads-4700w",
    "Brother ADS-4700W",
    `
      <html>
        <head>
          <meta property="og:title" content="Máy scan Brother ADS-4700W">
          <meta property="og:image" content="https://example.com/ignored.jpg">
        </head>
        <body>
          <table><tr><th>Tốc độ</th><td>40 ppm</td></tr></table>
        </body>
      </html>
    `,
  );
  const retailer = await extractProductFromUrl(
    "https://phucanh.vn/brother-ads-4700w.html",
    "Brother ADS-4700W",
    '<html><script type="application/ld+json">{"@type":"Product","name":"Brother ADS-4700W","offers":{"price":"12990000"}}</script></html>',
  );
  retailer.price = "12.990.000đ";

  const merged = mergeExtractedProducts([
    { data: official, sourceType: "manufacturer" },
    { data: retailer, sourceType: "retailer" },
  ]);
  assert.equal(merged.title, "Máy scan Brother ADS-4700W");
  assert.equal(merged.price, "12.990.000đ");
  assert.deepEqual(merged.specs, [{ label: "Tốc độ", value: "40 ppm" }]);
  assert.equal("imageUrls" in merged, false);

  console.log("scraper multi-source verification passed");
}

void main();
