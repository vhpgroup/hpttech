import {
  exportProductsExcel,
  exportProductsCSV,
  productExcelFilename,
  productExcelResponse,
  productExportFilename,
  productExportProfileFromRequest,
  productCSVResponse,
  productImportExportAuthorized,
  productImportTemplateExcel,
  productImportTemplateCSV,
} from "@/lib/product-import-export";

export async function GET(request: Request) {
  if (!productImportExportAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const profile = productExportProfileFromRequest(request);
  const templateProfile = profile === "all" ? "scanner" : profile;
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xls";

  if (format === "csv") {
    const csv = type === "template" ? productImportTemplateCSV(templateProfile) : await exportProductsCSV(profile);
    return productCSVResponse(csv, productExportFilename(type === "template" ? "template" : "export", profile));
  }

  const excel = type === "template" ? productImportTemplateExcel(templateProfile) : await exportProductsExcel(profile);
  return productExcelResponse(excel, productExcelFilename(type === "template" ? "template" : "export", profile));
}
