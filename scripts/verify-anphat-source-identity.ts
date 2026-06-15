import assert from "node:assert/strict";
import fs from "node:fs";

import {
  findExactSourceCandidate,
  sourceIdentityKey,
  sourceVariantSku,
} from "../lib/scraper/source-identity";

type SourceProduct = {
  productName: string;
  productSKU?: string;
  productUrl: string;
};

const payload = JSON.parse(
  fs.readFileSync("tmp/anphat-software-all.json", "utf8"),
) as { list: SourceProduct[] };
const products = payload.list;
const categoryUrl = "https://www.anphatpc.com.vn/phan-mem_dm401.html";

assert.equal(products.length, 98);
for (const product of products) {
  const match = findExactSourceCandidate(products, product.productName);
  assert.equal(match.productUrl, product.productUrl);
}

const identityKeys = products.map((product) =>
  sourceIdentityKey(new URL(product.productUrl, categoryUrl).toString()),
);
const variantSkus = products.map((product) =>
  sourceVariantSku(
    new URL(product.productUrl, categoryUrl).toString(),
    product.productSKU,
  ),
);
assert.equal(new Set(identityKeys).size, products.length);
assert.equal(new Set(variantSkus).size, products.length);

console.log(
  `An Phát source identity verified for ${products.length} products.`,
);
