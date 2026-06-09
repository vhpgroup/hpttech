import {
  productExcelFilename,
  productExcelResponse,
  productExportFilename,
  productExportProfileFromRequest,
  productCSVResponse,
  productImportExportAuthorized,
} from "@/lib/product-import-export";
import {
  canonicalProductTemplateCSV,
  canonicalProductTemplateExcel,
  exportCanonicalProductsCSV,
  exportCanonicalProductsExcel,
} from "@/lib/canonical-product-import-export";

export async function GET(request: Request) {
  if (!productImportExportAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const profile = productExportProfileFromRequest(request);
  const templateProfile = profile === "all" ? "scanner" : profile;
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";

  if (format === "csv") {
    const csv =
      type === "template"
        ? canonicalProductTemplateCSV(templateProfile)
        : await exportCanonicalProductsCSV(profile);
    return productCSVResponse(csv, productExportFilename(type === "template" ? "template" : "export", profile));
  }

  const excel =
    type === "template"
      ? await canonicalProductTemplateExcel(templateProfile)
      : await exportCanonicalProductsExcel(profile);
  return productExcelResponse(excel, productExcelFilename(type === "template" ? "template" : "export", profile));
}
