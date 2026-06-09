"use client";

import { useMemo, useState } from "react";
import { CheckCircle, ExternalLink, Loader2, Search, UploadCloud } from "lucide-react";
import type { ScrapedProduct } from "@/lib/scraper/types";

type SearchResponse = {
  error?: string;
  found?: boolean;
  jobId?: string | number;
  product?: ScrapedProduct;
};

type ImportResponse = {
  duplicate?: boolean;
  error?: string;
  productId?: string | number;
  status?: string;
};

const exampleUrls = [
  "https://www.epson.com.vn/for-home/ink-tank-printers/ecotank/epson-ecotank-l3250-a4-wi-fi-all-in-one-ink-tank-printer/p/C11CJ67503",
  "https://www.brother.com.vn/vi-vn/products/all-printers/printers/hl-l2321d",
];

export default function ScraperDashboardClient() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | number>();
  const [product, setProduct] = useState<ScrapedProduct>();
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<ImportResponse>();
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const canSearch = useMemo(() => url.trim().startsWith("http"), [url]);

  async function searchByUrl() {
    setError("");
    setImportResult(undefined);
    setProduct(undefined);
    setJobId(undefined);
    setIsSearching(true);

    try {
      const response = await fetch(`/api/scraper/search?url=${encodeURIComponent(url.trim())}`, {
        method: "POST",
      });
      const result = (await response.json()) as SearchResponse;

      if (!response.ok || result.error || !result.product) {
        throw new Error(result.error || "Chua cao duoc san pham.");
      }

      setJobId(result.jobId);
      setProduct(result.product);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chua cao duoc san pham.");
    } finally {
      setIsSearching(false);
    }
  }

  async function importDraft() {
    if (!jobId) return;
    setError("");
    setIsImporting(true);

    try {
      const response = await fetch(`/api/scraper/import?jobId=${encodeURIComponent(String(jobId))}`, {
        method: "POST",
      });
      const result = (await response.json()) as ImportResponse;

      if (!response.ok || result.error) {
        throw new Error(result.error || "Chua import duoc san pham.");
      }

      setImportResult(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chua import duoc san pham.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="payload-scraper-shell">
      <section className="payload-scraper-hero">
        <div>
          <p className="payload-scraper-eyebrow">Product Auto-Fill</p>
          <h1>Cao du lieu san pham</h1>
          <p>
            Dan link san pham chinh hang, bam Tim kiem de cao du lieu, sinh noi dung va SEO,
            sau do import vao Payload duoi dang draft.
          </p>
        </div>
      </section>

      <section className="payload-scraper-panel">
        <label htmlFor="scraper-url">Link san pham chinh hang</label>
        <div className="payload-scraper-search-row">
          <input
            id="scraper-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSearch && !isSearching) {
                void searchByUrl();
              }
            }}
            placeholder="https://www.epson.com.vn/.../p/C11CJ67503"
          />
          <button type="button" onClick={searchByUrl} disabled={!canSearch || isSearching}>
            {isSearching ? <Loader2 className="payload-scraper-spin" size={18} /> : <Search size={18} />}
            Tim kiem
          </button>
        </div>

        <div className="payload-scraper-examples">
          {exampleUrls.map((example) => (
            <button key={example} type="button" onClick={() => setUrl(example)}>
              {example.includes("epson") ? "Epson L3250" : "Brother HL-L2321D"}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="payload-scraper-error">{error}</div> : null}

      {product ? (
        <section className="payload-scraper-preview">
          <div className="payload-scraper-preview-head">
            <div>
              <p className="payload-scraper-eyebrow">Preview</p>
              <h2>{product.data.title}</h2>
              <p>{product.source.brand} · Confidence {Math.round(product.confidence * 100)}%</p>
            </div>
            <button type="button" onClick={importDraft} disabled={isImporting || Boolean(importResult)}>
              {isImporting ? (
                <Loader2 className="payload-scraper-spin" size={18} />
              ) : importResult ? (
                <CheckCircle size={18} />
              ) : (
                <UploadCloud size={18} />
              )}
              {importResult ? "Da import" : "Import vao CMS"}
            </button>
          </div>

          <div className="payload-scraper-grid">
            <article>
              <h3>Thong tin</h3>
              <dl>
                <div>
                  <dt>SKU</dt>
                  <dd>{product.data.sku || "Chua co"}</dd>
                </div>
                <div>
                  <dt>Gia</dt>
                  <dd>{product.data.price || "Can nhap/kiem tra"}</dd>
                </div>
                <div>
                  <dt>URL nguon</dt>
                  <dd>
                    <a href={product.source.url} target="_blank" rel="noreferrer">
                      Mo link <ExternalLink size={13} />
                    </a>
                  </dd>
                </div>
              </dl>
            </article>

            <article>
              <h3>SEO</h3>
              <p className="payload-scraper-seo-title">{product.seo.title}</p>
              <p>{product.seo.description}</p>
            </article>

            <article>
              <h3>Can review</h3>
              {product.warnings.length ? (
                <ul>
                  {product.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p>Khong co warning lon.</p>
              )}
            </article>
          </div>

          <article className="payload-scraper-summary">
            <h3>Mo ta ngan</h3>
            <p>{product.generated.summary}</p>
          </article>

          {importResult?.productId ? (
            <div className="payload-scraper-success">
              Draft da tao:{" "}
              <a href={`/admin/collections/products/${importResult.productId}`}>
                mo san pham #{importResult.productId}
              </a>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
