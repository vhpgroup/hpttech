import {
  importCanonicalProductsCSV,
  importCanonicalProductsRows,
} from "@/lib/canonical-product-import-export";
import {
  parseExcelWorkbook,
  productImportExportAuthorized,
} from "@/lib/product-import-export";

export async function POST(request: Request) {
  if (!productImportExportAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let csv = "";
  let rows: Awaited<ReturnType<typeof parseExcelWorkbook>> | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (file instanceof File) {
      const isXLSX =
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.type.includes("spreadsheetml");
      if (isXLSX) {
        rows = await parseExcelWorkbook(await file.arrayBuffer());
      } else {
        csv = await file.text();
      }
    } else {
      csv = String(form.get("csv") || "");
    }
  } else {
    csv = await request.text();
  }

  if (!rows?.length && !csv.trim()) {
    return Response.json({ error: "Missing CSV file or body" }, { status: 400 });
  }

  const result = rows ? await importCanonicalProductsRows(rows) : await importCanonicalProductsCSV(csv);
  return Response.json(result);
}
