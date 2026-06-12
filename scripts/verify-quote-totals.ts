import assert from "node:assert/strict";
import { getVatInclusiveQuoteTotals } from "../lib/quote-totals";

assert.deepEqual(getVatInclusiveQuoteTotals(11_890_000, 1), {
  subtotal: 10_809_000,
  vat: 1_081_000,
  total: 11_890_000,
});

assert.deepEqual(getVatInclusiveQuoteTotals(11_890_000, 2), {
  subtotal: 21_618_000,
  vat: 2_162_000,
  total: 23_780_000,
});

assert.deepEqual(getVatInclusiveQuoteTotals(0, 1), {
  subtotal: 0,
  vat: 0,
  total: 0,
});

console.log("Quote total checks passed.");
