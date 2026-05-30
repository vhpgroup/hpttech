import { ArrowRight, BadgeCheck, ShieldCheck, ShoppingCart, Sparkles, Truck } from "lucide-react";
import { HPT_DATA } from "@/lib/data";
import BannerSlider from "@/components/home/BannerSlider";
import CategoryPanel from "@/components/home/CategoryPanel";
import { HomeFloors } from "@/components/home/HomeFloors";

export default function HomePage() {
  return (
    <main>
      <section className="hero-section">
        <CategoryPanel />

        <div className="hero-commerce-area">
          <BannerSlider banners={HPT_DATA.banners} />

          <aside className="commercial-stack" aria-label="Ưu đãi nhanh">
            <a className="commercial-tile scanner" href="/san-pham">
              <img
                className="commercial-tile-image"
                src="/assets/commercial-blocks/scanner.jpg"
                alt="Commercial block máy scan"
                loading="lazy"
              />
              <span className="commercial-products">Máy scan</span>
              <strong>Số hóa tài liệu</strong>
              <small>Ricoh, Fujitsu, Epson, Plustek cho văn phòng hiện đại</small>
            </a>
            <a className="commercial-tile printer" href="/san-pham">
              <img
                className="commercial-tile-image"
                src="/assets/commercial-blocks/printer.jpg"
                alt="Commercial block máy in"
                loading="lazy"
              />
              <span className="commercial-products">Máy in</span>
              <strong>In ấn doanh nghiệp</strong>
              <small>HP, Brother, Epson, Kyocera chính hãng, dễ triển khai</small>
            </a>
          </aside>

          <section className="commercial-row" aria-label="Khuyến mãi thương mại HPT Tech">
            <a className="commercial-tile office" href="/san-pham">
              <img
                className="commercial-tile-image"
                src="/assets/commercial-blocks/office.jpg"
                alt="Commercial block thiết bị văn phòng"
                loading="lazy"
              />
              <span className="commercial-products">Thiết bị văn phòng</span>
              <strong>Combo tối ưu chi phí</strong>
              <small>Tư vấn cấu hình theo quy mô đội nhóm</small>
            </a>
            <a className="commercial-tile solution" href="/giai-phap">
              <img
                className="commercial-tile-image"
                src="/assets/commercial-blocks/solution.jpg"
                alt="Commercial block giải pháp"
                loading="lazy"
              />
              <span className="commercial-products">Giải pháp</span>
              <strong>Triển khai trọn gói</strong>
              <small>Hạ tầng, mạng, bảo mật và thiết bị đồng bộ</small>
            </a>
            <a className="commercial-tile service" href="/dich-vu">
              <img
                className="commercial-tile-image"
                src="/assets/commercial-blocks/service.jpg"
                alt="Commercial block dịch vụ"
                loading="lazy"
              />
              <span className="commercial-products">Dịch vụ</span>
              <strong>Hỗ trợ tận nơi</strong>
              <small>Lắp đặt, bảo hành, bảo trì nhanh cho doanh nghiệp</small>
            </a>
          </section>
        </div>
      </section>

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

      <HomeFloors />

      <section className="brand-strip" id="brands">
        <h2>Đối tác công nghệ hàng đầu</h2>
        <div id="brandLogos">
          {HPT_DATA.brands.map((brand) => (
            <span key={brand.name}>
              <img src={brand.logo} alt={brand.name} loading="lazy" />
              <b>{brand.name}</b>
            </span>
          ))}
        </div>
      </section>

      <section className="solutions" id="solutions">
        <div className="solution-intro">
          <h2>Giải pháp doanh nghiệp</h2>
          <p>
            HPT Tech cung cấp các giải pháp công nghệ toàn diện, giúp doanh nghiệp tối ưu vận hành và bứt phá
            thành công.
          </p>
          <a href="https://hpttech.vn/aboutus/" target="_blank" rel="noreferrer">
            Xem tất cả giải pháp <ArrowRight size={16} />
          </a>
        </div>

        <div className="solution-grid" id="solutionGrid">
          {HPT_DATA.solutions.map((solution) => (
            <article key={solution.title} className="solution-card">
              <i data-lucide={solution.icon} />
              <h3>{solution.title}</h3>
              <p>{solution.description}</p>
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
                <img src={post.image} alt={post.title} />
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
    </main>
  );
}
