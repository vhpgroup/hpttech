import { readSpreadsheetValues, writeSpreadsheetValues } from "@/lib/google-sheets";

const DEFAULT_QUOTE_SHEET_ID = "1T1wy4eTrjMbn4SWPtNUoCan1TKHvWwxHbhLThqEXtuc";

const SHEET_ID = process.env.QUOTE_SHEET_ID || DEFAULT_QUOTE_SHEET_ID;
const TAB = process.env.QUOTE_SHEET_TAB || "Yêu cầu báo giá";

export type QuoteLeadRow = {
  quoteId: string;
  dateLabel: string;
  company: string;
  taxCode: string;
  contact: string;
  phone: string;
  email: string;
  productsLabel: string;
  totalLabel: string;
  note: string;
};

export async function appendQuoteToSheet(lead: QuoteLeadRow) {
  if (!SHEET_ID) return;

  const row = [
    lead.quoteId,
    lead.dateLabel,
    "Mới",
    "",
    lead.company,
    lead.taxCode,
    lead.contact,
    lead.phone,
    lead.email,
    lead.productsLabel,
    lead.totalLabel,
    lead.note,
  ];

  const rows = await readSpreadsheetValues(SHEET_ID, TAB);
  const nextRow = Math.max(rows.length + 1, 2);

  await writeSpreadsheetValues(SHEET_ID, [
    {
      range: `${TAB}!B${nextRow}:M${nextRow}`,
      values: [row],
    },
  ]);
}
