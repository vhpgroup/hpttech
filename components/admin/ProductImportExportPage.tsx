"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileDown,
  FileSpreadsheet,
  FileUp,
  KeyRound,
  PackageCheck,
} from "lucide-react";

type ImportResult = {
  created: number;
  errors: Array<{ message: string; row: number; sku?: string }>;
  skipped: number;
  updated: number;
};

type ProductProfile = "all" | "scanner" | "printer" | "photocopier";

const productProfiles: Array<{ label: string; value: ProductProfile }> = [
  { label: "Máy scan", value: "scanner" },
  { label: "Máy in", value: "printer" },
  { label: "Máy photocopy", value: "photocopier" },
  { label: "Tất cả sản phẩm", value: "all" },
];

function withSecret(url: string, secret: string) {
  if (!secret) return url;
  const nextUrl = new URL(url, window.location.origin);
  nextUrl.searchParams.set("secret", secret);
  return nextUrl.pathname + nextUrl.search;
}

export default function ProductImportExportPage() {
  const [secret, setSecret] = useState("");
  const [profile, setProfile] = useState<ProductProfile>("scanner");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const download = (type: "template" | "products") => {
    const path =
      type === "template"
        ? `/api/admin/products/export?type=template&profile=${profile === "all" ? "scanner" : profile}`
        : `/api/admin/products/export?profile=${profile}`;
    window.location.href = withSecret(path, secret);
  };

  const importFile = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Chọn file Excel hoặc CSV trước khi import.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch(withSecret("/api/admin/products/import", secret), {
        body: form,
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Import thất bại.");
      setResult(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="hpt-import-page">
      <header className="hpt-page-heading">
        <div>
          <nav aria-label="Breadcrumb">
            <a href="/admin">Dashboard</a>
            <span>/</span>
            <span>Import / Export</span>
          </nav>
          <h1>Import / Export sản phẩm</h1>
          <p>Thêm mới, cập nhật hoặc xuất catalog hàng loạt bằng file Excel/CSV đã chuẩn hóa.</p>
        </div>
        <a className="hpt-tail-button hpt-tail-button--secondary" href="/admin/collections/products">
          <PackageCheck size={17} />
          Xem danh sách sản phẩm
        </a>
      </header>

      <section className="hpt-import-summary" aria-label="Hướng dẫn nhanh">
        <article>
          <span className="is-blue"><FileDown size={20} /></span>
          <div><strong>1. Tải file mẫu</strong><small>Đúng cột theo từng loại máy</small></div>
        </article>
        <article>
          <span className="is-amber"><FileSpreadsheet size={20} /></span>
          <div><strong>2. Điền dữ liệu</strong><small>Mỗi sản phẩm là một dòng</small></div>
        </article>
        <article>
          <span className="is-green"><FileUp size={20} /></span>
          <div><strong>3. Import và kiểm tra</strong><small>Hệ thống báo rõ dòng bị lỗi</small></div>
        </article>
      </section>

      <div className="hpt-import-layout">
        <aside className="hpt-tail-card hpt-import-settings">
          <div className="hpt-tail-card__head">
            <div>
              <span className="hpt-tail-icon is-blue"><KeyRound size={19} /></span>
              <div><h2>Cấu hình dữ liệu</h2><p>Chọn đúng nhóm trước khi tải file.</p></div>
            </div>
          </div>

          <label className="hpt-tail-field">
            <span>Loại sản phẩm</span>
            <select value={profile} onChange={(event) => setProfile(event.target.value as ProductProfile)}>
              {productProfiles.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <small>File mẫu sẽ có bộ thông số phù hợp với loại máy đã chọn.</small>
          </label>

          <label className="hpt-tail-field">
            <span>Mã bảo vệ API</span>
            <input
              onChange={(event) => setSecret(event.target.value)}
              placeholder="PRODUCT_IMPORT_EXPORT_SECRET"
              type="password"
              value={secret}
            />
            <small>Local có thể để trống. Production dùng secret trong biến môi trường.</small>
          </label>

          <div className="hpt-import-note">
            <AlertCircle size={17} />
            <p>Không đổi tên cột trong file mẫu. Nên import sản phẩm ở trạng thái draft rồi kiểm tra trước khi publish.</p>
          </div>
        </aside>

        <div className="hpt-import-workspace">
          <section className="hpt-tail-card">
            <div className="hpt-tail-card__head">
              <div>
                <span className="hpt-tail-icon is-indigo"><Download size={19} /></span>
                <div><h2>Xuất dữ liệu</h2><p>Tải file mẫu hoặc dữ liệu đang có để chỉnh sửa hàng loạt.</p></div>
              </div>
            </div>
            <div className="hpt-import-actions">
              <button className="hpt-tail-button hpt-tail-button--secondary" onClick={() => download("template")} type="button">
                <FileDown size={17} /> Tải file mẫu
              </button>
              <button className="hpt-tail-button hpt-tail-button--primary" onClick={() => download("products")} type="button">
                <Download size={17} /> Export sản phẩm
              </button>
            </div>
          </section>

          <section className="hpt-tail-card">
            <div className="hpt-tail-card__head">
              <div>
                <span className="hpt-tail-icon is-green"><FileUp size={19} /></span>
                <div><h2>Nhập dữ liệu</h2><p>Tạo mới hoặc cập nhật theo mã Product và SKU trong file.</p></div>
              </div>
            </div>

            <label className="hpt-import-dropzone">
              <FileSpreadsheet size={30} />
              <strong>Chọn file Excel hoặc CSV</strong>
              <small>Hỗ trợ .xls, .html và .csv</small>
              <input accept=".xls,.html,.csv,text/csv,application/vnd.ms-excel" ref={fileRef} type="file" />
            </label>

            <button
              className="hpt-tail-button hpt-tail-button--primary hpt-import-submit"
              disabled={busy}
              onClick={importFile}
              type="button"
            >
              <FileUp size={17} />
              {busy ? "Đang import..." : "Bắt đầu import"}
            </button>

            {error ? (
              <div className="hpt-import-alert is-error"><AlertCircle size={18} /><span>{error}</span></div>
            ) : null}

            {result ? (
              <div className="hpt-import-result">
                <div className="hpt-import-result__title">
                  <CheckCircle2 size={19} />
                  <strong>Import hoàn tất</strong>
                </div>
                <div className="hpt-import-result__stats">
                  <Stat label="Tạo mới" value={result.created} tone="green" />
                  <Stat label="Cập nhật" value={result.updated} tone="blue" />
                  <Stat label="Bỏ qua" value={result.skipped} tone="amber" />
                  <Stat label="Lỗi" value={result.errors.length} tone="red" />
                </div>
                {result.errors.length ? (
                  <div className="hpt-import-errors">
                    {result.errors.slice(0, 50).map((item) => (
                      <p key={`${item.row}-${item.message}`}>
                        <b>Dòng {item.row}{item.sku ? ` (${item.sku})` : ""}:</b> {item.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, tone, value }: { label: string; tone: string; value: number }) {
  return (
    <div className={`hpt-import-stat is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
