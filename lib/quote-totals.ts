const DEFAULT_VAT_RATE = 0.1;
const DEFAULT_ROUNDING_UNIT = 1_000;

function roundToUnit(value: number, unit: number) {
  return Math.round(value / unit) * unit;
}

export function getVatInclusiveQuoteTotals(
  unitPrice: number,
  quantity: number,
  vatRate = DEFAULT_VAT_RATE,
  roundingUnit = DEFAULT_ROUNDING_UNIT,
) {
  const safeUnitPrice = Number.isFinite(unitPrice) ? Math.max(0, unitPrice) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
  const grossTotal = safeUnitPrice * safeQuantity;
  const subtotal = roundToUnit(grossTotal / (1 + vatRate), roundingUnit);
  const vat = grossTotal - subtotal;

  return {
    subtotal,
    vat,
    total: grossTotal,
  };
}
