import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { HPT_DATA } from "@/lib/data";
import type { PublicSolution } from "@/lib/content-payload";

// Icon 3D dải cam kết — cùng bộ phong cách Fluent 3D với icon sidebar danh mục,
// tự host trên media R2 của site (/api/r2-media/icon-cam-ket-<slug>.png).
const TRUST_ITEMS = [
  { icon: "chinh-hang", label: "Chính hãng 100%" },
  { icon: "gia-tot", label: "Giá tốt doanh nghiệp" },
  { icon: "giao-hang", label: "Giao hàng toàn quốc" },
  { icon: "ho-tro", label: "Hỗ trợ kỹ thuật" },
  { icon: "xuat-vat", label: "Xuất VAT đầy đủ" },
];

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Cam kết dịch vụ HPT Tech">
      {TRUST_ITEMS.map((item) => (
        <article className="trust-item" key={item.icon}>
          <Image
            src={`/api/r2-media/icon-cam-ket-${item.icon}.png`}
            alt=""
            aria-hidden="true"
            width={30}
            height={30}
            loading="lazy"
          />
          <span>
            <strong>{item.label}</strong>
          </span>
        </article>
      ))}
    </section>
  );
}

export default function HomeStaticSections({ solutions }: { solutions: PublicSolution[] }) {
  return (
    <>
      <section className="brand-strip" id="brands">
        <h2>Đối tác công nghệ hàng đầu</h2>
        <div id="brandLogos">
          {HPT_DATA.brands.map((brand) => (
            <span key={brand.name}>
              <Image src={`/${brand.logo}`} alt={brand.name} width={96} height={40} sizes="96px" />
              <b>{brand.name}</b>
            </span>
          ))}
        </div>
      </section>

      <section className="solutions" id="solutions">
        <div className="solution-intro">
          <h2>Giải pháp doanh nghiệp</h2>
          <p>
            HPT Tech cung cấp các giải pháp công nghệ toàn diện, giúp doanh nghiệp tối ưu vận hành
            và bứt phá thành công.
          </p>
          <a href="https://hpttech.vn/aboutus/" target="_blank" rel="noreferrer">
            Xem tất cả giải pháp <ArrowRight size={16} />
          </a>
        </div>

        <div className="solution-grid" id="solutionGrid">
          {solutions.map((sol) => (
            <article key={sol.title} className="solution-card">
              <i data-lucide={sol.icon} />
              <h3>{sol.title}</h3>
              <p>{sol.description}</p>
              <a href="/giai-phap">
                Xem chi tiết <ArrowRight size={16} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="news" id="news">
        <div className="section-head">
          <h2>Tin tức & tiêu điểm</h2>
          <a href="https://hpttech.vn/blog/" target="_blank" rel="noreferrer">
            Xem tất cả <ArrowRight size={16} />
          </a>
        </div>

        <div className="news-grid" id="newsGrid">
          {HPT_DATA.posts.map((post) => (
            <article key={post.title} className="post-card">
              <a href={post.href} target="_blank" rel="noreferrer">
                <Image src={post.image} alt={post.title} width={360} height={200} sizes="(max-width: 767px) 100vw, 360px" />
              </a>
              <div className="post-info">
                <span className="post-date">{post.date}</span>
                <h3>
                  <a href={post.href} target="_blank" rel="noreferrer">
                    {post.title}
                  </a>
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
