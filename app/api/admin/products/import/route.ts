import { importProductsCSV, productImportExportAuthorized } from "@/lib/product-import-export";

export async function POST(request: Request) {
  if (!productImportExportAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let csv = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    csv = file instanceof File ? await file.text() : String(form.get("csv") || "");
  } else {
    csv = await request.text();
  }

  if (!csv.trim()) {
    return Response.json({ error: "Missing CSV file or body" }, { status: 400 });
  }

  const result = await importProductsCSV(csv);
  return Response.json(result);
}
