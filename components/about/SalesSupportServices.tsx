"use client";

/**
 * Section "Các dịch vụ hỗ trợ bán hàng" — trang Về HPT.
 * Sơ đồ hành trình dịch vụ (dựng theo bố cục tham khảo psd.com.vn/dich-vu-va-giai-phap):
 * - Cột trái sticky: sơ đồ SVG 11 mắt xích (7 dịch vụ + 4 mốc ngữ cảnh) nối bằng
 *   đường ray uốn qua 3 hàng, huy hiệu logo HPT treo tại các điểm giao.
 * - Cột phải: 7 khối mô tả; cuộn tới khối nào thì icon tương ứng "sáng" lên
 *   (bỏ grayscale) và nhãn đổi màu xanh lá thương hiệu.
 * - Bấm icon trên sơ đồ để cuộn tới khối mô tả tương ứng.
 * Icon nhúng base64 trong ./sales-support-assets (trang tự chứa — xem ghi chú đầu file đó).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { DVBH_ICONS, type DvbhIconKey } from "./sales-support-assets";
import "./sales-support-services.css";

/** Toạ độ Y của 3 đường ray ngang trong viewBox 1000x900. */
const RAIL_1 = 222;
const RAIL_2 = 494;
const RAIL_3 = 766;

type NodeDef = {
  id: string;
  icon: DvbhIconKey;
  x: number;
  y: number;
  rail: number;
  /** Chỉ số dịch vụ (0-6) — node bấm được; -1 = mốc ngữ cảnh, không bấm. */
  svc: number;
  /** Node "sáng" khi tiến trình cuộn đạt chỉ số dịch vụ này. */
  reveal: number;
  label: string[];
};

const NODES: NodeDef[] = [
  { id: "research", icon: "research", x: 300, y: 170, rail: RAIL_1, svc: 0, reveal: 0, label: ["NGHIÊN CỨU", "THỊ TRƯỜNG"] },
  { id: "analysis", icon: "analysis", x: 475, y: 170, rail: RAIL_1, svc: 1, reveal: 1, label: ["PHÂN TÍCH", "SẢN PHẨM"] },
  { id: "factory", icon: "factory", x: 655, y: 170, rail: RAIL_1, svc: -1, reveal: 2, label: ["HÃNG SẢN XUẤT"] },
  { id: "ship", icon: "ship", x: 825, y: 170, rail: RAIL_1, svc: -1, reveal: 2, label: ["NHẬP KHẨU"] },
  { id: "logistics", icon: "logistics", x: 770, y: 442, rail: RAIL_2, svc: 2, reveal: 2, label: ["DỊCH VỤ", "LOGISTICS"] },
  { id: "finance", icon: "finance", x: 575, y: 442, rail: RAIL_2, svc: 3, reveal: 3, label: ["DỊCH VỤ", "TÀI CHÍNH"] },
  { id: "channel", icon: "channel", x: 390, y: 442, rail: RAIL_2, svc: 4, reveal: 4, label: ["KÊNH BÁN HÀNG"] },
  { id: "customer", icon: "customer", x: 300, y: 714, rail: RAIL_3, svc: -1, reveal: 5, label: ["KHÁCH HÀNG"] },
  { id: "marketing", icon: "marketing", x: 490, y: 714, rail: RAIL_3, svc: 5, reveal: 5, label: ["MARKETING"] },
  { id: "consumer", icon: "consumer", x: 655, y: 714, rail: RAIL_3, svc: -1, reveal: 5, label: ["NGƯỜI SỬ DỤNG"] },
  { id: "warranty", icon: "warranty", x: 825, y: 714, rail: RAIL_3, svc: 6, reveal: 6, label: ["BẢO HÀNH"] },
];

type ServiceDef = { icon: DvbhIconKey; title: string; desc: string };

const SERVICES: ServiceDef[] = [
  {
    icon: "research",
    title: "Nghiên cứu thị trường",
    desc: "Trước khi tư vấn bất kỳ giải pháp nào, HPT luôn bắt đầu từ việc tìm hiểu thị trường và nhu cầu thực tế của khách hàng. Đội ngũ HPT khảo sát, đánh giá khách quan để lựa chọn sản phẩm, giải pháp phù hợp nhất với từng cơ quan, doanh nghiệp.",
  },
  {
    icon: "analysis",
    title: "Phân tích sản phẩm",
    desc: "Với hệ sinh thái thiết bị văn phòng và giải pháp số hóa đa dạng, HPT phân tích, so sánh kỹ lưỡng từng dòng sản phẩm — từ hiệu năng, độ bền tới chi phí vận hành — giúp khách hàng chọn đúng thiết bị cho đúng nhu cầu.",
  },
  {
    icon: "logistics",
    title: "Dịch vụ logistics",
    desc: "HPT tổ chức chặt chẽ khâu lưu kho, vận chuyển và giao nhận: hàng hóa được kiểm tra kỹ trước khi xuất kho, giao đúng hẹn và lắp đặt tận nơi, đảm bảo thiết bị sẵn sàng hoạt động ngay khi bàn giao.",
  },
  {
    icon: "finance",
    title: "Dịch vụ tài chính",
    desc: "HPT xây dựng chính sách giá, công nợ và thanh toán linh hoạt cho khách hàng cơ quan, doanh nghiệp — xuất VAT đầy đủ, dựa trên nguyên tắc cốt lõi: hợp tác lâu dài, minh bạch và tin tưởng lẫn nhau.",
  },
  {
    icon: "channel",
    title: "Kênh bán hàng",
    desc: "HPT phục vụ khách hàng qua nhiều kênh — website hpttech.vn, tư vấn trực tiếp và đội ngũ kinh doanh — sẵn sàng hỗ trợ nhanh chóng từ báo giá, đặt hàng tới xử lý các vấn đề sau bán hàng.",
  },
  {
    icon: "marketing",
    title: "Marketing",
    desc: "HPT phối hợp cùng các hãng triển khai chương trình khuyến mãi, giới thiệu sản phẩm mới nhằm tăng cường độ nhận diện thương hiệu và mang lại lợi ích thiết thực cho khách hàng.",
  },
  {
    icon: "warranty",
    title: "Bảo hành",
    desc: "Là khâu quyết định niềm tin và sự quay trở lại của khách hàng, dịch vụ bảo hành của HPT phối hợp chặt chẽ với hãng để tiếp nhận, sửa chữa, đổi trả và thay thế linh kiện nhanh chóng — đồng hành trọn vòng đời sản phẩm.",
  },
];

/** Huy hiệu logo HPT treo trên đường ray (x, y tâm huy hiệu; rail = y đường ray). */
const BADGES = [
  { x: 462, y: 300, rail: RAIL_1 },
  { x: 600, y: 578, rail: RAIL_2 },
  { x: 490, y: 846, rail: RAIL_3 },
  { x: 825, y: 846, rail: RAIL_3 },
];

/** Kích thước logo trong huy hiệu (giữ tỉ lệ ảnh badge ~2.3:1). */
const BADGE_LOGO_W = 46;
const BADGE_LOGO_H = 20;

const RAIL_PATH =
  "M60,222 H902 Q930,222 930,250 V466 Q930,494 902,494 H150 Q122,494 122,522 V738 Q122,766 150,766 H952";

export default function SalesSupportServices() {
  const [active, setActive] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Chọn khối gần tâm khung nhìn nhất làm khối đang đọc.
  useEffect(() => {
    let raf = 0;
    const pick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cy = window.innerHeight * 0.42;
        let best = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        blockRefs.current.forEach((el, i) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - cy);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        setActive(best);
      });
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, []);

  const goTo = useCallback((svc: number) => {
    blockRefs.current[svc]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <section className="sec" id="dich-vu-ho-tro-ban-hang">
      <div className="wrap">
        <div className="sec-head center reveal">
          <div className="kicker" style={{ justifyContent: "center" }}>
            <span className="tri">
              <i></i>
              <i></i>
              <i></i>
            </span>{" "}
            Các dịch vụ hỗ trợ bán hàng
          </div>
          <h2 className="h2">Đồng hành từ thị trường đến bảo hành</h2>
          <p className="lead center" style={{ marginTop: "14px", marginInline: "auto" }}>
            Bảy dịch vụ hỗ trợ xuyên suốt hành trình cung ứng — cuộn để xem từng mắt xích
            sáng lên, hoặc bấm vào icon trên sơ đồ để tới mục tương ứng.
          </p>
        </div>

        <div className="dvbh-stage">
          <div className="dvbh-left" aria-hidden="false">
            <svg viewBox="0 0 1000 900" role="img" aria-label="Sơ đồ các dịch vụ hỗ trợ bán hàng của HPT">
              {/* Nền nhóm */}
              <rect className="dvbh-tile" x="238" y="100" width="300" height="150" rx="16" />
              <rect className="dvbh-tile" x="320" y="372" width="522" height="150" rx="16" />
              <rect className="dvbh-tile" x="442" y="644" width="96" height="150" rx="14" />
              <rect className="dvbh-tile" x="777" y="644" width="96" height="150" rx="14" />
              <rect className="dvbh-obox" x="250" y="126" width="652" height="128" rx="24" />
              <rect className="dvbh-obox" x="176" y="470" width="726" height="322" rx="26" />

              {/* Đường ray + hiệu ứng chạy */}
              <path className="dvbh-rail" d={RAIL_PATH} />
              <path className="dvbh-flow" d={RAIL_PATH} />

              {/* Chân nối + chấm đỏ của từng node */}
              {NODES.map((n) => (
                <g key={`c-${n.id}`}>
                  <line className="dvbh-stem" x1={n.x} y1={n.y + 30} x2={n.x} y2={n.rail} />
                  <circle className="dvbh-dot" cx={n.x} cy={n.rail} r="5.4" />
                </g>
              ))}

              {/* Huy hiệu logo HPT */}
              {BADGES.map((b, i) => (
                <g key={`b-${i}`}>
                  <line className="dvbh-pin" x1={b.x} y1={b.rail} x2={b.x} y2={b.y - 30} />
                  <circle className="dvbh-pindot" cx={b.x} cy={b.rail} r="3.2" />
                  <circle className="dvbh-badge" cx={b.x} cy={b.y} r="30" />
                  <image
                    href={DVBH_ICONS.badge}
                    x={b.x - BADGE_LOGO_W / 2}
                    y={b.y - BADGE_LOGO_H / 2}
                    width={BADGE_LOGO_W}
                    height={BADGE_LOGO_H}
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
              ))}

              {/* Node icon + nhãn */}
              {NODES.map((n) => {
                const isSvc = n.svc >= 0;
                const on = n.reveal <= active;
                const act = isSvc && n.svc === active;
                return (
                  <g
                    key={n.id}
                    className="dvbh-node"
                    {...(isSvc
                      ? {
                          role: "button",
                          tabIndex: 0,
                          "aria-label": `Xem dịch vụ: ${SERVICES[n.svc].title}`,
                          onClick: () => goTo(n.svc),
                          onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              goTo(n.svc);
                            }
                          },
                        }
                      : {})}
                  >
                    <image
                      className={`dvbh-ic${isSvc ? " svc" : ""}${on ? " on" : ""}${act ? " act" : ""}`}
                      href={DVBH_ICONS[n.icon]}
                      x={n.x - 48}
                      y={n.y - 48}
                      width="96"
                      height="96"
                      preserveAspectRatio="xMidYMid meet"
                    />
                    {n.label.map((line, k) => (
                      <text
                        key={k}
                        className={`dvbh-lbl ${isSvc ? "svc" : "ctx"}${on ? " on" : ""}`}
                        x={n.x}
                        y={n.rail + 38 + k * 18}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="dvbh-right">
            {SERVICES.map((s, i) => (
              <div
                key={s.title}
                className={`dvbh-blk${i === active ? " on" : ""}`}
                ref={(el) => {
                  blockRefs.current[i] = el;
                }}
              >
                <svg className="dvbh-ico" viewBox="0 0 46 46" aria-hidden="true">
                  <image href={DVBH_ICONS[s.icon]} x="0" y="0" width="46" height="46" preserveAspectRatio="xMidYMid meet" />
                </svg>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
