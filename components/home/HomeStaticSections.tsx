import Image from "next/image";
import { ArrowRight, BadgeCheck, ShieldCheck, ShoppingCart, Sparkles, Truck } from "lucide-react";
import { HPT_DATA } from "@/lib/data";
import type { PublicSolution } from "@/lib/content-payload";

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Cam kết dịch vụ HPT Tech">
      <article className="trust-item">
        <BadgeCheck size={18} />
        <span>100% chính hãng</span>
      </article>
      <article className="trust-item">
        <Sparkles size={18} />
        <span>Giá ưu đãi</span>
      </article>
      <article className="trust-item">
        <Truck size={18} />
        <span>Miễn phí vận chuyển</span>
      </article>
      <article className="trust-item">
        <ShieldCheck size={18} />
        <span>Bảo hành nơi sử dụng</span>
      </article>
      <article className="trust-item">
        <ArrowRight size={18} />
        <span>Đổi trả lên đến 30 ngày</span>
      </article>
      <article className="trust-item">
        <ShoppingCart size={18} />
        <span>Thanh toán linh hoạt</span>
      </article>
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
              <Image src={`/${brand.logo}`} alt={brand.name} width={96} height={40} />
              <b>{brand.name}</b>
            </span>
          ))}
        </div>
      </section>

      <section className="solutions" id="solutions">
        <div className="solution-intro">
          <h2>Giải pháp doanh nghiệp</h2>
          <p>HPT Tech cung cấp các giải pháp công nghệ toàn diện, giúp doanh nghiệp tối ưu vận hành và bứt phá thành công.</p>
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
                <Image src={post.image} alt={post.title} width={360} height={200} />
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
