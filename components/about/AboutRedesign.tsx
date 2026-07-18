"use client";

/**
 * Trang "Về HPT" — bản redesign (không header/footer, dùng layout chung của site).
 * - Nội dung tĩnh (chưa nối Payload CMS — có thể chuyển vào CMS sau).
 * - Toàn bộ ảnh/logo/icon nhúng base64 trong ./about-assets (tự chứa, không cần media ngoài).
 * - Style scoped dưới .vehpt (./about-redesign.css) để không đụng chạm style site.
 */
import { useEffect, useRef } from "react";
import Image from "next/image";
import "./about-redesign.css";

export default function AboutRedesign() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Hiệu ứng reveal khi cuộn
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0, rootMargin: "0px 0px 260px 0px" }
    );
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    // Form liên hệ — TODO (deploy): thay mailto bằng API/CRM của HPT
    const cf = root.querySelector<HTMLFormElement>("#ctaForm");
    const onSubmit = (e: Event) => {
      e.preventDefault();
      const q = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;
      const name = q<HTMLInputElement>("#cfName");
      const phone = q<HTMLInputElement>("#cfPhone");
      const org = q<HTMLInputElement>("#cfOrg").value.trim();
      const mail = q<HTMLInputElement>("#cfMail").value.trim();
      const topic = q<HTMLSelectElement>("#cfTopic").value;
      const msg = q<HTMLTextAreaElement>("#cfMsg").value.trim();
      const note = q<HTMLParagraphElement>("#cfNote");
      let ok = true;
      [name, phone].forEach((el) => {
        el.classList.remove("err");
        if (!el.value.trim()) {
          el.classList.add("err");
          ok = false;
        }
      });
      if (phone.value.trim() && !/^[0-9+][0-9 .()-]{7,14}$/.test(phone.value.trim())) {
        phone.classList.add("err");
        ok = false;
      }
      if (!ok) {
        note.className = "cf-note bad";
        note.textContent = "Vui lòng điền Họ tên và Số điện thoại hợp lệ.";
        return;
      }
      const body = encodeURIComponent(
        `Họ và tên: ${name.value.trim()}\nĐiện thoại: ${phone.value.trim()}\nĐơn vị: ${org || "—"}\nEmail: ${mail || "—"}\nNhu cầu: ${topic}\nNội dung: ${msg || "—"}`
      );
      const a = document.createElement("a");
      a.href = `mailto:info@hpttech.vn?subject=${encodeURIComponent(
        "Yêu cầu tư vấn — " + name.value.trim()
      )}&body=${body}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      note.className = "cf-note ok";
      note.textContent =
        "Đã ghi nhận yêu cầu của bạn. Nếu trình duyệt không mở email, vui lòng gọi 0967 286 889 hoặc gửi về info@hpttech.vn.";
      cf?.reset();
    };
    cf?.addEventListener("submit", onSubmit);

    return () => {
      io.disconnect();
      cf?.removeEventListener("submit", onSubmit);
    };
  }, []);

  return (
    <div className="vehpt" ref={rootRef}>
<section className="hero">
  <svg className="nodes" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g stroke="#5b8cff" strokeWidth="1" fill="#7fa8ff">
      <line x1="120" y1="90" x2="260" y2="160"/><line x1="260" y1="160" x2="220" y2="300"/><line x1="260" y1="160" x2="420" y2="120"/>
      <line x1="1200" y1="420" x2="1320" y2="360"/><line x1="1320" y1="360" x2="1280" y2="230"/><line x1="1080" y1="480" x2="1200" y2="420"/>
      <circle cx="120" cy="90" r="4"/><circle cx="260" cy="160" r="6"/><circle cx="220" cy="300" r="4"/><circle cx="420" cy="120" r="4"/>
      <circle cx="1200" cy="420" r="5"/><circle cx="1320" cy="360" r="4"/><circle cx="1280" cy="230" r="4"/><circle cx="1080" cy="480" r="4"/>
    </g>
  </svg>
  <svg className="skyline" viewBox="0 0 1440 210" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <g fill="#0d2a63">
      <rect x="0" y="120" width="70" height="90"/><rect x="80" y="90" width="46" height="120"/><rect x="134" y="140" width="60" height="70"/>
      <rect x="204" y="70" width="54" height="140"/><rect x="266" y="110" width="80" height="100"/><rect x="356" y="150" width="50" height="60"/>
      <rect x="416" y="95" width="60" height="115"/><rect x="486" y="60" width="40" height="150"/><rect x="536" y="130" width="70" height="80"/>
      <rect x="616" y="100" width="58" height="110"/><rect x="684" y="145" width="66" height="65"/><rect x="760" y="80" width="48" height="130"/>
      <rect x="818" y="120" width="74" height="90"/><rect x="902" y="55" width="44" height="155"/><rect x="956" y="135" width="60" height="75"/>
      <rect x="1026" y="100" width="70" height="110"/><rect x="1106" y="150" width="52" height="60"/><rect x="1168" y="85" width="56" height="125"/>
      <rect x="1234" y="125" width="80" height="85"/><rect x="1324" y="70" width="46" height="140"/><rect x="1380" y="130" width="60" height="80"/>
    </g>
  </svg>
  <div className="wrap">
    <div className="breadcrumb"><a href="#">Trang chủ</a><span>›</span><span className="cur">Giới thiệu</span></div>
    <div className="hero-grid">
      <div>
        <div className="kicker on-dark"><span className="tri"><i></i><i></i><i></i></span> Giới thiệu HPT Technology</div>
        <h1>Đối tác <span className="g">tích hợp hệ thống</span> & chuyển đổi số cho cơ quan nhà nước và doanh nghiệp</h1>
        <p className="lead">HPT TECH là doanh nghiệp tư vấn, cung cấp thiết bị, tích hợp hệ thống, phát triển phần mềm và triển khai các giải pháp chuyển đổi số — với năng lực triển khai <strong style={{color:'#fff'}}>tổng thể, xuyên suốt vòng đời dự án</strong> tại Việt Nam.</p>
        <div className="hero-actions">
          <a href="#lien-he" className="btn btn-primary">Nhận tư vấn giải pháp
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
          <a href="#linh-vuc" className="btn btn-ghost">Khám phá năng lực</a>
        </div>
      </div>
      <div>
        <div className="cred-card">
          <div className="cc-h"><span className="dot"></span> Hồ sơ năng lực</div>
          <div className="cc-row">
            <div className="ic"><img src="/ve-hpt/icon-0.png" alt="" className="i3m" decoding="async" /></div>
            <div className="tx"><small>Tên pháp lý</small><b>Công ty TNHH Đầu tư Xây dựng & Thiết bị Công nghệ HPT</b></div>
          </div>
          <div className="cc-row">
            <div className="ic"><img src="/ve-hpt/icon-1.png" alt="" className="i3m" decoding="async" /></div>
            <div className="tx"><small>Trụ sở chính</small><b>SB04 Vinhomes Marina, P. An Biên, TP. Hải Phòng</b></div>
          </div>
          <div className="cc-row">
            <div className="ic"><img src="/ve-hpt/icon-2.png" alt="" className="i3m" decoding="async" /></div>
            <div className="tx"><small>Mã số thuế</small><b>0202253444</b></div>
          </div>
          <div className="cc-row">
            <div className="ic"><img src="/ve-hpt/icon-3.png" alt="" className="i3m" decoding="async" /></div>
            <div className="tx"><small>Phạm vi triển khai</small><b>Toàn quốc · Hải Phòng · Hà Nội · TP.HCM · Cần Thơ</b></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


<div className="wrap">
  <div className="promise reveal">
    <div className="promise-inner">
      <div className="promise-item"><span className="n">01</span><span className="t"><b>Tư vấn đúng nhu cầu</b><span>Khảo sát & phân tích thực tế</span></span></div>
      <div className="promise-item"><span className="n">02</span><span className="t"><b>Tích hợp đúng giải pháp</b><span>Đồng bộ, mở rộng, hiệu quả</span></span></div>
      <div className="promise-item"><span className="n">03</span><span className="t"><b>Triển khai đúng cam kết</b><span>Tiến độ, chất lượng, hậu mãi</span></span></div>
    </div>
  </div>
</div>


<section className="stats">
  <div className="wrap">
    <div className="stats-grid reveal">
      <div className="stat"><div className="num">20+</div><div className="lbl">Năm kinh nghiệm</div><div className="sub">Trong lĩnh vực CNTT & thiết bị công nghệ</div></div>
      <div className="stat r"><div className="num">100+</div><div className="lbl">Dự án đã triển khai</div><div className="sub">Trên phạm vi toàn quốc</div></div>
      <div className="stat g"><div className="num">20+</div><div className="lbl">Nhân sự & chuyên gia</div><div className="sub">Đội ngũ kỹ thuật chuyên môn cao</div></div>
      <div className="stat"><div className="num">5+</div><div className="lbl">Chứng chỉ quốc tế</div><div className="sub">Chứng nhận chuyên môn của các hãng</div></div>
    </div>
  </div>
</section>


<section className="about" id="ve-chung-toi">
  <div className="wrap about-grid">
    <div className="reveal">
      <div className="kicker"><span className="tri"><i></i><i></i><i></i></span> Về HPT Technology</div>
      <h2 className="h2" style={{marginBottom:'22px'}}>Từ nhà cung cấp thiết bị đến đối tác tích hợp hệ thống toàn diện</h2>
      <p>Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT – <strong>HPT TECH</strong> hoạt động trong lĩnh vực tư vấn, cung cấp thiết bị, tích hợp hệ thống, phát triển phần mềm và triển khai các giải pháp chuyển đổi số cho cơ quan nhà nước, tổ chức và doanh nghiệp tại Việt Nam.</p>
      <p>Nền tảng phát triển của HPT được hình thành từ kinh nghiệm thực tiễn của người sáng lập với <strong>hơn 20 năm</strong> hoạt động trong lĩnh vực phân phối thiết bị công nghệ thông tin và thiết bị máy văn phòng. Kế thừa nền tảng đó, HPT TECH từng bước phát triển thành doanh nghiệp có năng lực triển khai tổng thể — từ khảo sát, tư vấn, thiết kế giải pháp, cung cấp thiết bị, phát triển phần mềm, tích hợp hệ thống đến đào tạo, chuyển giao, bảo hành và hỗ trợ vận hành sau đầu tư.</p>
      <div className="factlist">
        <div><small>Loại hình</small><b>Tư vấn · Tích hợp hệ thống</b></div>
        <div><small>Chuyên môn</small><b>Hạ tầng · Phần mềm · CĐS</b></div>
        <div><small>Khách hàng</small><b>Cơ quan NN & Doanh nghiệp</b></div>
        <div><small>Giai đoạn tầm nhìn</small><b>2026 – 2030</b></div>
      </div>
    </div>
    <div className="about-media reveal">
      <Image src="/ve-hpt/tru-so-va-doi-ngu-hpt-technology-tai-vinhomes-ma.jpg" alt="Trụ sở và đội ngũ HPT Technology tại Vinhomes Marina, Hải Phòng" width={1100} height={902} sizes="(max-width: 920px) 92vw, 560px" />
    </div>
  </div>
</section>


<section className="sec tint" id="khach-hang">
  <div className="wrap">
    <div className="sec-head reveal">
      <div className="kicker"><span className="tri"><i></i><i></i><i></i></span> Định hướng hoạt động</div>
      <h2 className="h2">Đối tượng khách hàng trọng tâm</h2>
      <p className="lead" style={{marginTop:'14px'}}>HPT TECH tập trung phục vụ các dự án đầu tư công, chuyển đổi số và hiện đại hóa hạ tầng CNTT cho khối cơ quan nhà nước, tổ chức và doanh nghiệp.</p>
    </div>
    <div className="sector-grid reveal">
      <div className="sector"><div className="si"><img src="/ve-hpt/huy-hieu-dang-cong-san-viet-nam.png" alt="Huy hiệu Đảng Cộng sản Việt Nam" decoding="async" /></div><b>Cơ quan Đảng</b></div>
      <div className="sector"><div className="si"><img src="/ve-hpt/quoc-huy-nuoc-chxhcn-viet-nam.png" alt="Quốc huy nước CHXHCN Việt Nam" decoding="async" /></div><b>Cơ quan hành chính nhà nước</b></div>
      <div className="sector"><div className="si"><img src="/ve-hpt/logo-bo-khoa-hoc-va-cong-nghe.png" alt="Logo Bộ Khoa học và Công nghệ" decoding="async" /></div><b>Bộ, ban, ngành & đơn vị trực thuộc</b></div>
      <div className="sector"><div className="si"><img src="/ve-hpt/cong-an-hieu.png" alt="Công an hiệu" decoding="async" /></div><b>Công an & lực lượng vũ trang</b></div>
      <div className="sector"><div className="si"><img src="/ve-hpt/logo-bo-y-te.png" alt="Logo Bộ Y tế" decoding="async" /></div><b>Bệnh viện & cơ sở y tế</b></div>
      <div className="sector"><div className="si"><img src="/ve-hpt/logo-bo-giao-duc-va-dao-tao.png" alt="Logo Bộ Giáo dục và Đào tạo" decoding="async" /></div><b>Trường đại học, cao đẳng & giáo dục</b></div>
      <div className="sector"><div className="si"><img src="/ve-hpt/logo-tap-doan-dien-luc-viet-nam-evn.png" alt="Logo Tập đoàn Điện lực Việt Nam EVN" decoding="async" /></div><b>Điện lực & doanh nghiệp nhà nước</b></div>
      <div className="sector"><div className="si"><img src="/ve-hpt/logo-tong-cong-ty-cang-hang-khong-viet-nam-acv.png" alt="Logo Tổng công ty Cảng hàng không Việt Nam ACV" decoding="async" /></div><b>Cảng biển, logistics & giao thông</b></div>
      <div className="sector"><div className="si"><img src="/ve-hpt/huy-hieu-bo-tai-chinh.png" alt="Huy hiệu Bộ Tài chính" decoding="async" /></div><b>Ngân hàng & tổ chức tài chính</b></div>
      <div className="sector"><div className="si"><img src="/ve-hpt/logo-lien-doan-thuong-mai-va-cong-nghiep-viet-na.png" alt="Logo Liên đoàn Thương mại và Công nghiệp Việt Nam VCCI" decoding="async" /></div><b>Doanh nghiệp SX, thương mại & dịch vụ</b></div>
    </div>
  </div>
</section>


<section className="sec">
  <div className="wrap">
    <div className="life">
      <div className="life-card reveal">
        <div className="ring"></div><div className="ring2"></div>
        <h3>Năng lực triển khai dự án Chính phủ</h3>
        <p>HPT TECH có khả năng tham gia xuyên suốt vòng đời của một dự án công nghệ thông tin — bảo đảm tính đồng bộ, khả năng mở rộng, hiệu quả đầu tư và sự phù hợp với quy trình vận hành thực tế của từng cơ quan, đơn vị.</p>
        <span className="tag"><img src="/ve-hpt/icon-15.png" alt="" style={{width:'16px',height:'16px'}} decoding="async" /> Triển khai tổng thể — trọn vòng đời dự án</span>
      </div>
      <div className="reveal">
        <div className="life-list">
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Khảo sát & đánh giá hiện trạng</span></div>
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Tư vấn giải pháp & phương án đầu tư</span></div>
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Thiết kế cấu hình kỹ thuật</span></div>
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Lập danh mục thiết bị & phần mềm</span></div>
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Cung cấp thiết bị chính hãng</span></div>
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Phát triển phần mềm theo yêu cầu</span></div>
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Thi công, lắp đặt & tích hợp hệ thống</span></div>
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Kiểm thử, nghiệm thu & bàn giao</span></div>
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Đào tạo & chuyển giao công nghệ</span></div>
          <div className="li"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Bảo hành, bảo trì & hỗ trợ vận hành</span></div>
        </div>
      </div>
    </div>
  </div>
</section>


<section className="sec tint" id="linh-vuc">
  <div className="wrap">
    <div className="sec-head center reveal">
      <div className="kicker" style={{justifyContent:'center'}}><span className="tri"><i></i><i></i><i></i></span> Các lĩnh vực hoạt động chính</div>
      <h2 className="h2">Giải pháp hạ tầng &amp; thiết bị công&nbsp;nghệ</h2>
      <p className="lead center" style={{marginTop:'14px'}}>Tư vấn, cung cấp và triển khai đồng bộ các nhóm giải pháp cốt lõi phục vụ cơ quan nhà nước và doanh nghiệp.</p>
    </div>
    <div className="domain-grid reveal">
      <div className="domain">
        <div className="dh"><div className="di"><img src="/ve-hpt/icon-may-tinh-ha-tang-cntt.png" alt="Icon máy tính — hạ tầng CNTT" decoding="async" /></div>
          <div><div className="dn">01</div><h3>Hạ tầng công nghệ thông tin</h3><div className="dt">Hiệu năng cao · Ổn định · Dễ mở rộng</div></div></div>
        <div className="chiplist"><span>Máy chủ</span><span>Trung tâm dữ liệu</span><span>Lưu trữ SAN/NAS</span><span>Sao lưu & khôi phục</span><span>Máy tính để bàn</span><span>Laptop</span><span>All-in-One</span><span>Mini PC</span><span>Máy trạm</span><span>Thiết bị ngoại vi</span><span>UPS</span><span>Tủ rack & phụ kiện</span></div>
      </div>
      <div className="domain">
        <div className="dh"><div className="di"><img src="/ve-hpt/icon-anten-ve-tinh-ha-tang-mang-vien-thong.png" alt="Icon anten vệ tinh — hạ tầng mạng viễn thông" decoding="async" /></div>
          <div><div className="dn">02</div><h3>Hạ tầng mạng & viễn thông</h3><div className="dt">Kết nối thông suốt · Quản trị tập trung</div></div></div>
        <div className="chiplist"><span>Core Switch</span><span>Distribution Switch</span><span>Access Switch</span><span>Router</span><span>Wi-Fi doanh nghiệp</span><span>Wi-Fi tập trung</span><span>LAN/WAN</span><span>VPN</span><span>Cáp mạng</span><span>Cáp quang</span><span>Tủ mạng</span><span>Giám sát hạ tầng</span></div>
      </div>
      <div className="domain accent-r">
        <div className="dh"><div className="di"><img src="/ve-hpt/icon-la-chan-an-toan-thong-tin.png" alt="Icon lá chắn — an toàn thông tin" decoding="async" /></div>
          <div><div className="dn">03</div><h3>An toàn thông tin</h3><div className="dt">Bảo vệ nhiều lớp · An toàn theo cấp độ</div></div></div>
        <div className="chiplist"><span>Tường lửa thế hệ mới</span><span>Endpoint Security</span><span>EDR/XDR</span><span>VPN</span><span>Network Access Control</span><span>Bảo vệ email</span><span>Chống mã độc</span><span>Quản lý nhật ký</span><span>Giám sát ATTT</span><span>Sao lưu & phục hồi</span><span>ATTT theo cấp độ</span></div>
      </div>
      <div className="domain">
        <div className="dh"><div className="di"><img src="/ve-hpt/icon-may-in-in-an-va-so-hoa.png" alt="Icon máy in — in ấn và số hóa" decoding="async" /></div>
          <div><div className="dn">04</div><h3>Máy in, máy quét & số hóa</h3><div className="dt">Hiệu suất cao · Số hóa nhanh</div></div></div>
        <div className="chiplist"><span>Máy in văn phòng</span><span>Máy in tốc độ cao</span><span>Máy in khổ lớn</span><span>Máy quét chuyên dụng</span><span>Scan tốc độ cao</span><span>Scan A3</span><span>Scan sách</span><span>Scan hộ chiếu</span><span>Số hóa hồ sơ</span><span>OCR</span><span>Lưu trữ điện tử</span><span>Quản lý tài liệu</span></div>
      </div>
      <div className="domain accent-g">
        <div className="dh"><div className="di"><img src="/ve-hpt/icon-camera-giam-sat-thong-minh.png" alt="Icon camera — giám sát thông minh" decoding="async" /></div>
          <div><div className="dn">05</div><h3>Camera AI & đô thị thông minh</h3><div className="dt">Giám sát thông minh · Phân tích AI</div></div></div>
        <div className="chiplist"><span>Camera AI an ninh</span><span>Nhận diện biển số</span><span>Phân tích giao thông</span><span>Phát hiện ùn tắc</span><span>Phát hiện tụ tập</span><span>Phát hiện xâm nhập</span><span>Phát hiện khói/cháy</span><span>Giám sát công cộng</span><span>Trường học & bệnh viện</span><span>Trung tâm điều hành</span></div>
      </div>
      <div className="domain">
        <div className="dh"><div className="di"><img src="/ve-hpt/icon-man-hinh-hoi-nghi-truyen-hinh.png" alt="Icon màn hình — hội nghị truyền hình" decoding="async" /></div>
          <div><div className="dn">06</div><h3>Hội nghị truyền hình & phòng họp</h3><div className="dt">Kết nối mọi khoảng cách</div></div></div>
        <div className="chiplist"><span>Hội nghị truyền hình</span><span>Camera PTZ</span><span>Micro hội nghị</span><span>Loa hội nghị</span><span>Màn hình hiển thị</span><span>Trình chiếu không dây</span><span>Phòng họp thông minh</span><span>Điều khiển tập trung</span><span>Teams · Zoom · Meet · Webex</span><span>Ghi âm/ghi hình</span><span>Đa điểm cầu</span></div>
      </div>
    </div>
  </div>
</section>


<section className="sec dark">
  <div className="wrap">
    <div className="sec-head reveal">
      <div className="kicker on-dark"><span className="tri"><i></i><i></i><i></i></span> Phát triển phần mềm & chuyển đổi số</div>
      <h2 className="h2 on-dark">Không chỉ là thiết bị — chúng tôi xây dựng nền tảng số</h2>
      <p className="lead on-dark" style={{marginTop:'14px'}}>HPT TECH định hướng phát triển thành doanh nghiệp có năng lực nghiên cứu, thiết kế và xây dựng các nền tảng phần mềm phục vụ chuyển đổi số.</p>
    </div>
    <div className="soft-grid reveal">
      <div className="soft">
        <div className="sh"><div className="sic"><img src="/ve-hpt/icon-22.png" alt="" className="i3s" decoding="async" /></div><h3>Website & cổng thông tin điện tử</h3></div>
        <p>Chuẩn UI/UX · Tối ưu SEO · Responsive · Bảo mật · Quản trị nội dung linh hoạt.</p>
        <div className="mini">
          <div className="m"><span className="i3c" aria-hidden="true"></span>Website doanh nghiệp, tổ chức, thương mại điện tử</div>
          <div className="m"><span className="i3c" aria-hidden="true"></span>Cổng thông tin điện tử · nội bộ · dịch vụ trực tuyến</div>
          <div className="m"><span className="i3c" aria-hidden="true"></span>Landing Page · đa ngôn ngữ · tích hợp thanh toán & CRM</div>
        </div>
      </div>
      <div className="soft">
        <div className="sh"><div className="sic"><img src="/ve-hpt/icon-23.png" alt="" className="i3s" decoding="async" /></div><h3>Phát triển ứng dụng công nghệ</h3></div>
        <p>Web · Mobile · AI · Tích hợp · Linh hoạt theo nghiệp vụ thực tế.</p>
        <div className="mini">
          <div className="m"><span className="i3c" aria-hidden="true"></span>Ứng dụng Web & Mobile (Android/iOS)</div>
          <div className="m"><span className="i3c" aria-hidden="true"></span>Dashboard điều hành · báo cáo thông minh (BI)</div>
          <div className="m"><span className="i3c" aria-hidden="true"></span>Ứng dụng AI · hệ thống API · tích hợp dữ liệu</div>
        </div>
      </div>
      <div className="soft feature">
        <div className="inner">
          <div>
            <div className="sh"><div className="sic" style={{background:'rgba(0,162,74,.22)',borderColor:'rgba(57,217,138,.4)',color:'#39d98a'}}><img src="/ve-hpt/icon-24.png" alt="" className="i3s" decoding="async" /></div><h3>Phần mềm phòng họp không giấy</h3></div>
            <p>Số hóa toàn bộ quy trình tổ chức cuộc họp — giảm chi phí in ấn, tiết kiệm thời gian, tăng bảo mật và nâng cao hiệu quả điều hành.</p>
          </div>
          <div className="cols">
            <div className="m"><span className="i3c" aria-hidden="true"></span>Quản lý lịch & chương trình họp</div>
            <div className="m"><span className="i3c" aria-hidden="true"></span>Giấy mời & điểm danh điện tử</div>
            <div className="m"><span className="i3c" aria-hidden="true"></span>Phân phối & ghi chú tài liệu</div>
            <div className="m"><span className="i3c" aria-hidden="true"></span>Biểu quyết điện tử & lấy ý kiến</div>
            <div className="m"><span className="i3c" aria-hidden="true"></span>Quản lý nghị quyết & kết luận</div>
            <div className="m"><span className="i3c" aria-hidden="true"></span>Tích hợp chữ ký số & lưu biên bản</div>
          </div>
        </div>
      </div>
      <div className="soft wide">
        <div className="sh"><div className="sic"><img src="/ve-hpt/icon-25.png" alt="" className="i3s" decoding="async" /></div><h3>Phần mềm quản lý theo nghiệp vụ</h3></div>
        <p>Xây dựng mới, cải tiến, tích hợp và nâng cấp hệ thống theo quy trình của từng đơn vị.</p>
        <div className="chiplist" style={{marginTop:'4px'}}>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Quản lý văn bản & điều hành</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Quản lý công việc</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Nhân sự (HRM)</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Tài sản & thiết bị</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Kho</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Bán hàng</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>CRM</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>ERP</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Hợp đồng & dự án</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Bảo hành & bảo trì</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Quản lý trường học</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Quản lý cơ sở y tế</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Lịch công tác</span>
          <span style={{background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.12)',color:'#c8d5ee'}}>Quản lý hồ sơ</span>
        </div>
      </div>
    </div>
  </div>
</section>


<section className="sec">
  <div className="wrap">
    <div className="sec-head reveal">
      <div className="kicker"><span className="tri"><i></i><i></i><i></i></span> Năng lực đấu thầu & quản lý dự án</div>
      <h2 className="h2">Thế mạnh trong các dự án sử dụng ngân sách nhà nước</h2>
    </div>
    <div className="bid reveal">
      <div className="bid-left">
        <div className="glow"></div>
        <h3>Am hiểu quy trình — chủ động kiểm soát rủi ro</h3>
        <p>Sự am hiểu về quy trình đấu thầu, tiêu chuẩn kỹ thuật và hồ sơ pháp lý giúp HPT chủ động kiểm soát rủi ro và nâng cao hiệu quả thực hiện dự án — từ khâu phân tích hồ sơ mời thầu đến thanh, quyết toán.</p>
        <div className="big">A → Z</div>
        <div className="biglbl">Từ hồ sơ dự thầu đến nghiệm thu, hoàn công & quyết toán</div>
      </div>
      <div className="bid-right">
        <div className="bid-steps">
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Nghiên cứu & phân tích hồ sơ mời thầu</span></div>
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Phân tích yêu cầu kỹ thuật</span></div>
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Xác định sản phẩm & giải pháp đáp ứng</span></div>
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Xây dựng Compliance Matrix</span></div>
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Chuẩn bị hồ sơ dự thầu & kỹ thuật</span></div>
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Chứng minh nguồn gốc, xuất xứ (CO/CQ)</span></div>
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Làm việc với hãng & nhà phân phối</span></div>
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Tổ chức giao hàng, lắp đặt & tiến độ</span></div>
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Lập hồ sơ nghiệm thu & hoàn công</span></div>
          <div className="b"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Hồ sơ bảo hành, thanh toán & quyết toán</span></div>
        </div>
      </div>
    </div>
  </div>
</section>


<section className="sec tint" id="du-an">
  <div className="wrap">
    <div className="sec-head center reveal">
      <div className="kicker" style={{justifyContent:'center'}}><span className="tri"><i></i><i></i><i></i></span> Quy trình triển khai dự án</div>
      <h2 className="h2">7 bước triển khai chuẩn hóa</h2>
    </div>
    <div className="proc reveal">
      <div className="pstep"><div className="pn"><span className="pnum">1</span><img src="/ve-hpt/icon-26.png" alt="" className="i3p2" decoding="async" /></div><b>Khảo sát</b><small>Thu thập yêu cầu & hiện trạng</small></div>
      <div className="pstep"><div className="pn"><span className="pnum">2</span><img src="/ve-hpt/icon-27.png" alt="" className="i3p2" decoding="async" /></div><b>Tư vấn giải pháp</b><small>Phân tích & lựa chọn công nghệ</small></div>
      <div className="pstep"><div className="pn"><span className="pnum">3</span><img src="/ve-hpt/icon-28.png" alt="" className="i3p2" decoding="async" /></div><b>Thiết kế & kế hoạch</b><small>Thiết kế kỹ thuật, tiến độ</small></div>
      <div className="pstep"><div className="pn"><span className="pnum">4</span><img src="/ve-hpt/icon-29.png" alt="" className="i3p2" decoding="async" /></div><b>Cung cấp & triển khai</b><small>Lắp đặt, cấu hình, tích hợp</small></div>
      <div className="pstep"><div className="pn"><span className="pnum">5</span><img src="/ve-hpt/icon-30.png" alt="" className="i3p2" decoding="async" /></div><b>Kiểm thử & nghiệm thu</b><small>Chạy thử, đánh giá, bàn giao</small></div>
      <div className="pstep"><div className="pn"><span className="pnum">6</span><img src="/ve-hpt/icon-31.png" alt="" className="i3p2" decoding="async" /></div><b>Đào tạo & chuyển giao</b><small>Hướng dẫn vận hành, tài liệu</small></div>
      <div className="pstep"><div className="pn"><span className="pnum">7</span><img src="/ve-hpt/icon-32.png" alt="" className="i3p2" decoding="async" /></div><b>Bảo hành & hỗ trợ</b><small>Bảo trì suốt vòng đời hệ thống</small></div>
    </div>
  </div>
</section>


<section className="sec" id="doi-tac">
  <div className="wrap">
    <div className="sec-head center reveal">
      <div className="kicker" style={{justifyContent:'center'}}><span className="tri"><i></i><i></i><i></i></span> Hệ sinh thái đối tác công nghệ</div>
      <h2 className="h2">Hợp tác cùng các hãng công&nbsp;nghệ hàng đầu thế&nbsp;giới</h2>
      <p className="lead center" style={{marginTop:'14px'}}>Quan hệ hợp tác đa dạng giúp HPT đề xuất giải pháp phù hợp với từng yêu cầu kỹ thuật, quy mô đầu tư và ngân sách.</p>
    </div>
    <div className="partner-grid reveal">
      <div className="partner"><img src="/ve-hpt/dell-technologies.png" alt="Dell Technologies" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/hewlett-packard-enterprise.png" alt="Hewlett Packard Enterprise" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/lenovo.png" alt="Lenovo" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/hikvision.png" alt="Hikvision" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/dahua-technology.png" alt="Dahua Technology" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/fortinet.png" alt="Fortinet" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/cisco.png" alt="Cisco" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/aruba-a-hpe-company.png" alt="Aruba — a HPE company" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/microsoft.png" alt="Microsoft" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/vmware.png" alt="VMware" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/veeam.png" alt="Veeam" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/canon.png" alt="Canon" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/fujitsu.png" alt="Fujitsu" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/synology.png" alt="Synology" decoding="async" /></div>
      <div className="partner"><img src="/ve-hpt/qnap.png" alt="QNAP" decoding="async" /></div>
    </div>
        <div className="eco reveal">
      <span>Máy chủ</span><span>Thiết bị lưu trữ</span><span>Máy tính</span><span>Máy in · Máy quét</span><span>Thiết bị mạng</span><span>Thiết bị bảo mật</span><span>Camera giám sát</span><span>Thiết bị hội nghị</span><span>Thiết bị trình chiếu</span><span>Nguồn dự phòng</span><span>Phần mềm bản quyền</span><span>Nền tảng CĐS</span>
    </div>
  </div>
</section>


<section className="sec tint">
  <div className="wrap">
    <div className="sec-head reveal">
      <div className="kicker"><span className="tri"><i></i><i></i><i></i></span> Cam kết của HPT TECH</div>
      <h2 className="h2">Uy tín · Chất lượng · Trách nhiệm</h2>
      <p className="lead" style={{marginTop:'14px'}}>HPT lấy uy tín, chất lượng và trách nhiệm làm nền tảng trong mọi hoạt động kinh doanh và triển khai dự án.</p>
    </div>
    <div className="commit-grid reveal">
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Tư vấn đúng nhu cầu</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Đề xuất giải pháp phù hợp & hiệu quả</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Cung cấp sản phẩm chính hãng</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Bảo đảm nguồn gốc, xuất xứ rõ ràng</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Cung cấp đầy đủ tài liệu kỹ thuật</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Tuân thủ tiến độ hợp đồng</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Bảo đảm chất lượng thi công</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Bảo mật thông tin của khách hàng</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Đào tạo & chuyển giao đầy đủ</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Hỗ trợ kỹ thuật sau triển khai</span></div>
      <div className="commit"><span className="ck"><span className="i3c" aria-hidden="true"></span></span><span>Đồng hành lâu dài trong vận hành</span></div>
      <div className="commit" style={{background:'linear-gradient(135deg,var(--navy-2),var(--navy-deep))',border:'0'}}><span className="ck" style={{background:'rgba(255,255,255,.15)'}}><img src="/ve-hpt/icon-48.png" alt="" style={{width:'20px',height:'20px'}} decoding="async" /></span><span style={{color:'#fff'}}>11 cam kết cho mỗi dự án</span></div>
    </div>
  </div>
</section>


<section className="sec dark">
  <div className="wrap">
    <div className="sec-head center reveal">
      <div className="kicker on-dark" style={{justifyContent:'center'}}><span className="tri"><i></i><i></i><i></i></span> Tầm nhìn & Sứ mệnh · 2026 – 2030</div>
      <h2 className="h2 on-dark">Đồng hành cùng chuyển đổi số quốc&nbsp;gia</h2>
    </div>
    <div className="vm-grid reveal">
      <div className="vm vision">
        <div className="vmi"><img src="/ve-hpt/icon-49.png" alt="" className="i3v" decoding="async" /></div>
        <h3>Tầm nhìn</h3>
        <p>Trở thành doanh nghiệp uy tín trong lĩnh vực tích hợp hệ thống, phát triển phần mềm và triển khai chuyển đổi số tại Việt Nam.</p>
        <div className="focus-tags">
          <span>Chính phủ số</span><span>Chính quyền số</span><span>Hạ tầng số</span><span>Trung tâm dữ liệu</span><span>An toàn thông tin</span><span>Y tế số</span><span>Giáo dục số</span><span>Giao thông thông minh</span><span>Đô thị thông minh</span><span>Phòng họp không giấy</span><span>Số hóa tài liệu</span><span>Trí tuệ nhân tạo</span>
        </div>
      </div>
      <div className="vm mission">
        <div className="vmi"><img src="/ve-hpt/icon-50.png" alt="" className="i3v" decoding="async" /></div>
        <h3>Sứ mệnh</h3>
        <p>HPT TECH không chỉ cung cấp thiết bị công nghệ mà còn đồng hành cùng khách hàng trong việc xây dựng hệ thống, cải tiến quy trình và thực hiện chuyển đổi số.</p>
        <p>Với nền tảng hơn 20 năm kinh nghiệm của người sáng lập cùng đội ngũ chuyên môn và tinh thần trách nhiệm, HPT mang đến các giải pháp hiện đại, đồng bộ, an toàn và hiệu quả — hướng đến khả năng vận hành ổn định, mở rộng lâu dài và tạo ra giá trị thiết thực.</p>
      </div>
    </div>
    <div className="motto reveal">
      <div className="m-lbl">HPT TECHNOLOGY</div>
      <h3>Tư vấn <span className="r">đúng nhu cầu</span> — Tích hợp <span className="g">đúng giải pháp</span> — Triển khai <span className="r">đúng cam kết</span></h3>
    </div>
  </div>
</section>


<section className="cta" id="lien-he">
  <div className="wrap">
    <div className="cta-inner reveal">
      <div className="txt">
        <h2>Đăng ký nhận tư vấn giải&nbsp;pháp</h2>
        <p>HPT TECH sẵn sàng khảo sát nhu cầu và đề xuất phương án triển khai phù hợp cho cơ quan, tổ chức và doanh nghiệp của bạn — hoàn toàn miễn phí.</p>
        <div className="cta-contacts">
          <a className="cc-item" href="tel:0967286889"><img src="/ve-hpt/icon-51.png" alt="" /><span><small>Hotline tư vấn</small><b>0967 286 889</b></span></a>
          <a className="cc-item" href="mailto:info@hpttech.vn"><img src="/ve-hpt/icon-52.png" alt="" /><span><small>Email</small><b>info@hpttech.vn</b></span></a>
          <div className="cc-item"><img src="/ve-hpt/icon-53.png" alt="" /><span><small>Giờ làm việc</small><b>8:00 – 17:30 (T2–T7)</b></span></div>
        </div>
      </div>
      <div className="cta-form">
        <div className="cf-head"><b>Form liên hệ nhận tư vấn</b><span>Điền thông tin, HPT sẽ liên hệ lại trong giờ làm việc</span></div>
        
        <form id="ctaForm" noValidate>
          <div className="cf-row">
            <div className="cf-field"><label htmlFor="cfName">Họ và tên <i>*</i></label><input id="cfName" type="text" autoComplete="name" placeholder="Nguyễn Văn A" required /></div>
            <div className="cf-field"><label htmlFor="cfPhone">Số điện thoại <i>*</i></label><input id="cfPhone" type="tel" autoComplete="tel" placeholder="09xx xxx xxx" required /></div>
          </div>
          <div className="cf-row">
            <div className="cf-field"><label htmlFor="cfOrg">Cơ quan / Đơn vị</label><input id="cfOrg" type="text" autoComplete="organization" placeholder="Tên đơn vị của bạn" /></div>
            <div className="cf-field"><label htmlFor="cfMail">Email</label><input id="cfMail" type="email" autoComplete="email" placeholder="ban@donvi.vn" /></div>
          </div>
          <div className="cf-field"><label htmlFor="cfTopic">Nhu cầu tư vấn</label>
            <select id="cfTopic">
              <option>Hạ tầng công nghệ thông tin</option>
              <option>Hạ tầng mạng &amp; viễn thông</option>
              <option>An toàn thông tin</option>
              <option>Máy in, máy quét &amp; số hóa tài liệu</option>
              <option>Camera AI &amp; đô thị thông minh</option>
              <option>Hội nghị truyền hình &amp; phòng họp thông minh</option>
              <option>Phát triển phần mềm &amp; chuyển đổi số</option>
              <option>Nhu cầu khác</option>
            </select>
          </div>
          <div className="cf-field"><label htmlFor="cfMsg">Nội dung chi tiết</label><textarea id="cfMsg" rows="3" placeholder="Mô tả ngắn nhu cầu, quy mô, thời gian dự kiến..."></textarea></div>
          <button type="submit" className="btn btn-primary cf-submit">Gửi yêu cầu tư vấn
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
          <p className="cf-note" id="cfNote" role="status"></p>
        </form>
      </div>
    </div>
  </div>
</section>
    </div>
  );
}
