const menuData = window.HPT_DATA;

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderCompareButton(product) {
  const compare = window.HPTCompare;
  const key = compare?.getKey(product) || encodeURIComponent(product.href || product.title);
  const active = compare?.isCompared(key);

  return `
    <button
      class="compare-card-btn ${active ? "active" : ""}"
      type="button"
      data-compare-trigger
      data-compare-key="${escapeAttr(key)}"
      data-compare-title="${escapeAttr(product.title)}"
      data-compare-image="${escapeAttr(product.image)}"
      data-compare-price="${escapeAttr(product.price)}"
      data-compare-brand="${escapeAttr(product.brand)}"
      data-compare-category="${escapeAttr(product.category)}"
      data-compare-detail="${escapeAttr(product.detail)}"
      data-compare-href="${escapeAttr(product.href)}"
      aria-pressed="${active ? "true" : "false"}"
    >
      <i data-lucide="scale"></i>
      <span class="compare-card-label">${active ? "Đã chọn" : "So sánh"}</span>
    </button>
  `;
}

function renderCartButton(product) {
  const key = encodeURIComponent(product.href || product.title || `${product.brand}-${product.price}`);

  return `
    <button
      type="button"
      aria-label="Them ${escapeAttr(product.title)} vao gio"
      data-cart-add
      data-cart-key="${escapeAttr(key)}"
      data-cart-title="${escapeAttr(product.title)}"
      data-cart-image="${escapeAttr(product.image)}"
      data-cart-price="${escapeAttr(product.price)}"
      data-cart-brand="${escapeAttr(product.brand)}"
      data-cart-category="${escapeAttr(product.category)}"
      data-cart-detail="${escapeAttr(product.detail)}"
      data-cart-href="${escapeAttr(product.href)}"
    ><i data-lucide="shopping-cart"></i></button>
  `;
}

const pages = {
  "san-pham": {
    title: "Danh mục sản phẩm",
    intro: "Khám phá các thiết bị công nghệ, máy scan, máy in và giải pháp văn phòng đang được HPT Tech phân phối.",
    render: renderProductsPage,
  },
  "giai-phap": {
    title: "Giải pháp doanh nghiệp",
    intro: "Các gói giải pháp CNTT, an ninh, hội nghị và giáo dục thông minh cho doanh nghiệp, trường học và tổ chức.",
    render: renderSolutionsPage,
  },
  "thuong-hieu": {
    title: "Thương hiệu đối tác",
    intro: "Danh sách thương hiệu thiết bị và vật tư công nghệ HPT Tech đang đồng hành phân phối, tư vấn và triển khai.",
    render: renderBrandsPage,
  },
  "du-an": {
    title: "Dự án triển khai",
    intro: "Một số nhóm dự án tiêu biểu HPT Tech có thể triển khai cho doanh nghiệp, trường học và khối hành chính.",
    render: renderProjectsPage,
  },
  "dich-vu": {
    title: "Dịch vụ",
    intro: "Dịch vụ tư vấn, cung cấp thiết bị, triển khai hệ thống, bảo trì và hỗ trợ kỹ thuật sau bán hàng.",
    render: renderServicesPage,
  },
  "tin-tuc": {
    title: "Tin tức",
    intro: "Cập nhật kiến thức sản phẩm, hướng dẫn lựa chọn thiết bị và các bài viết công nghệ từ HPT Tech.",
    render: renderNewsPage,
  },
  "ve-hpt": {
    title: "Về HPT",
    intro: "HPT Tech cung cấp thiết bị công nghệ, giải pháp CNTT và hạ tầng kỹ thuật cho doanh nghiệp tại Việt Nam.",
    render: renderAboutPage,
  },
  "lien-he": {
    title: "Liên hệ",
    intro: "Gửi yêu cầu tư vấn, báo giá hoặc hỗ trợ kỹ thuật. Đội ngũ HPT Tech sẽ phản hồi trong thời gian sớm nhất.",
    render: renderContactPage,
  },
};

function renderPage() {
  renderSharedHeader();
  injectMenuNav();
  const key = document.body.dataset.page;
  const page = pages[key] || pages["san-pham"];
  document.title = `${page.title} - HPT Tech`;
  document.getElementById("pageTitle").textContent = page.title;
  document.getElementById("pageIntro").textContent = page.intro;
  page.render(document.getElementById("pageBody"));
  window.lucide?.createIcons();
}

function renderSharedHeader() {
  const header = document.querySelector(".topbar");
  if (!header) return;

  header.innerHTML = `
    <button class="icon-btn mobile-only" type="button" aria-label="Mở menu">
      <i data-lucide="menu"></i>
    </button>
    <a class="brand" href="index.html" aria-label="HPT Tech">
      <img src="https://hpttech.vn/media/32/content/HPT-Logo.png" alt="HPT Tech" />
    </a>
    <form class="search desktop-only" role="search">
      <input id="searchInput" type="search" placeholder="Tìm sản phẩm, giải pháp, thương hiệu..." />
      <select aria-label="Danh mục">
        <option>Danh mục</option>
        <option>Laptop doanh nghiệp</option>
        <option>Máy scan</option>
        <option>Thiết bị mạng</option>
      </select>
      <button type="submit" aria-label="Tìm kiếm"><i data-lucide="search"></i></button>
    </form>
    <div class="quick desktop-only">
      <span><i data-lucide="badge-check"></i><b>Báo giá nhanh</b><small>Nhận báo giá trong 15p</small></span>
      <span><i data-lucide="phone-call"></i><b>Hotline</b><small>0876 645 432</small></span>
    </div>
    <button class="cart" type="button" aria-label="Giỏ hàng">
      <i data-lucide="shopping-cart"></i>
      <span>0</span>
    </button>
  `;

  if (!document.querySelector(".mobile-nav")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<nav class="mobile-nav">
        <a href="index.html"><i data-lucide="home"></i><span>Trang chủ</span></a>
        <a href="san-pham.html"><i data-lucide="list"></i><span>Danh mục</span></a>
        <a class="quote" href="lien-he.html"><i data-lucide="shopping-bag"></i><span>Báo giá nhanh</span></a>
        <a href="tin-tuc.html"><i data-lucide="newspaper"></i><span>Tin tức</span></a>
        <a href="lien-he.html"><i data-lucide="user"></i><span>Tài khoản</span></a>
      </nav>`
    );
  }
}

function injectMenuNav() {
  const header = document.querySelector(".topbar");
  if (!header || document.querySelector(".nav")) return;

  header.insertAdjacentHTML(
    "afterend",
    `<nav class="nav desktop-only">
      <a class="catalog-trigger" href="san-pham.html"><i data-lucide="list"></i> Danh mục sản phẩm</a>
      <a href="giai-phap.html">Giải pháp</a>
      <a href="thuong-hieu.html">Thương hiệu</a>
      <a href="du-an.html">Dự án</a>
      <a href="dich-vu.html">Dịch vụ</a>
      <a href="tin-tuc.html">Tin tức</a>
      <a href="ve-hpt.html">Về HPT</a>
      <a href="lien-he.html">Liên hệ</a>
    </nav>`
  );
}

function renderProductsPage(target) {
  target.innerHTML = `<div class="product-grid page-products">${menuData.products.map(productCard).join("")}</div>`;
}

function productCard(product) {
  return `
    <article class="product-card">
      ${product.tag ? `<span class="badge">${product.tag}</span>` : ""}
      <a class="product-image" href="${product.href}" target="_blank" rel="noreferrer">
        <img src="${product.image}" alt="${product.title}" />
      </a>
      <div class="product-info">
        <span>${product.brand}</span>
        <h3>${product.title}</h3>
        <p>${product.detail}</p>
        <div class="product-actions">
          <strong>${product.price}</strong>
          ${renderCartButton(product)}
        </div>
        ${renderCompareButton(product)}
      </div>
    </article>
  `;
}

function renderSolutionsPage(target) {
  target.innerHTML = `<div class="page-grid">${menuData.solutions
    .map(
      ([title, text, icon]) => `
      <article class="page-card">
        <i data-lucide="${icon}"></i>
        <h3>${title}</h3>
        <p>${text}</p>
        <a href="lien-he.html">Tư vấn giải pháp <i data-lucide="arrow-right"></i></a>
      </article>
    `
    )
    .join("")}</div>${articleSection("Bài viết giải pháp", solutionArticles)}`;
}

function renderBrandsPage(target) {
  target.innerHTML = `<section class="brand-strip"><div id="brandLogos">${menuData.brands
    .map((brand) => `<span><img src="${brand.logo}" alt="${brand.name}" loading="lazy" /><b>${brand.name}</b></span>`)
    .join("")}</div></section>`;
}

function renderProjectsPage(target) {
  const projects = [
    ["Số hóa hồ sơ hành chính", "Triển khai máy scan tốc độ cao, quy trình nhập liệu và lưu trữ tài liệu tập trung.", "file-stack"],
    ["Phòng họp trực tuyến", "Tư vấn camera, âm thanh, màn hình trình chiếu và thiết bị hội nghị đồng bộ.", "presentation"],
    ["Hạ tầng mạng doanh nghiệp", "Thiết kế hệ thống switch, firewall, WiFi và tủ rack cho văn phòng nhiều tầng.", "network"],
    ["Lớp học thông minh", "Màn hình tương tác, máy chiếu, camera vật thể và thiết bị dạy học số.", "graduation-cap"],
  ];

  target.innerHTML = `<div class="page-grid">${projects.map(simpleCard).join("")}</div>${articleSection("Câu chuyện triển khai", projectArticles)}`;
}

function renderServicesPage(target) {
  const services = [
    ["Tư vấn thiết bị", "Khảo sát nhu cầu, cấu hình sản phẩm và đề xuất phương án đầu tư phù hợp.", "messages-square"],
    ["Cung cấp & lắp đặt", "Giao hàng, lắp đặt, cấu hình thiết bị tại văn phòng hoặc điểm triển khai.", "wrench"],
    ["Bảo trì định kỳ", "Kiểm tra, vệ sinh, cập nhật và tối ưu thiết bị để giảm rủi ro vận hành.", "settings"],
    ["Hỗ trợ kỹ thuật", "Tiếp nhận yêu cầu, xử lý sự cố và đồng hành sau bán hàng.", "headphones"],
  ];

  target.innerHTML = `<div class="page-grid">${services.map(simpleCard).join("")}</div>${articleSection("Hướng dẫn dịch vụ", serviceArticles)}`;
}

function renderNewsPage(target) {
  target.innerHTML = `<div class="news-grid page-news">${menuData.posts
    .map(
      (post) => `
      <article class="post-card">
        <a href="${post.href}" target="_blank" rel="noreferrer"><img src="${post.image}" alt="${post.title}" /></a>
        <div>
          <time>${post.date}</time>
          <h3>${post.title}</h3>
        </div>
      </article>
    `
    )
    .join("")}</div>${articleSection("Bài viết mới tạo", newsArticles)}`;
}

function renderAboutPage(target) {
  const aboutCards = [
    ["Thiết bị CNTT", "Phân phối máy scan, máy in, thiết bị văn phòng, thiết bị mạng và phần mềm bản quyền.", "monitor"],
    ["Giải pháp tổng thể", "Tư vấn, thiết kế, triển khai hạ tầng kỹ thuật và hệ thống số hóa.", "blocks"],
    ["Khách hàng doanh nghiệp", "Đồng hành cùng cơ quan nhà nước, doanh nghiệp, trường học và tổ chức.", "building-2"],
    ["Hỗ trợ lâu dài", "Chú trọng bảo hành, bảo trì và hỗ trợ kỹ thuật trong quá trình sử dụng.", "shield-check"],
  ];

  target.innerHTML = `<div class="page-grid">${aboutCards.map(simpleCard).join("")}</div>${articleSection("Góc nhìn HPT", aboutArticles)}`;
}

function renderContactPage(target) {
  target.innerHTML = `
    <div class="contact-layout">
      <div class="contact-box">
        <h2>Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT</h2>
        <p>MST: 0202253444</p>
        <p>SB.04 khu đô thị Vinhomes Marina, Phường An Biên, Thành phố Hải Phòng</p>
        <p>Tổng đài: 0876645432</p>
        <p>Email: bach.pv@hpttech.vn</p>
      </div>
      <form class="contact-box">
        <label>Họ tên<input type="text" placeholder="Nhập họ tên" /></label>
        <label>Số điện thoại<input type="tel" placeholder="Nhập số điện thoại" /></label>
        <label>Nội dung<textarea rows="5" placeholder="Bạn cần tư vấn gì?"></textarea></label>
        <button type="button">Gửi yêu cầu</button>
      </form>
    </div>
  `;
}

function simpleCard([title, text, icon]) {
  return `
    <article class="page-card">
      <i data-lucide="${icon}"></i>
      <h3>${title}</h3>
      <p>${text}</p>
    </article>
  `;
}

function articleSection(title, articles) {
  return `
    <section class="article-section">
      <div class="section-head compact">
        <h2>${title}</h2>
      </div>
      <div class="article-grid">
        ${articles
          .map(
            ([heading, text, tag]) => `
              <article class="article-card">
                <span>${tag}</span>
                <h3>${heading}</h3>
                <p>${text}</p>
                <a href="lien-he.html">Trao đổi thêm <i data-lucide="arrow-right"></i></a>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

const solutionArticles = [
  ["Checklist xây dựng hạ tầng CNTT cho văn phòng mới", "Các hạng mục cần chuẩn bị trước khi triển khai mạng LAN, WiFi, tủ rack, máy chủ và chính sách bảo mật nội bộ.", "Hạ tầng CNTT"],
  ["Khi nào doanh nghiệp nên đầu tư hệ thống số hóa tài liệu?", "Nhận biết các điểm nghẽn trong lưu trữ giấy, quy trình phê duyệt và tìm kiếm hồ sơ để lựa chọn máy scan phù hợp.", "Số hóa"],
  ["Phòng họp trực tuyến cần những thiết bị nào?", "Gợi ý cấu hình camera, loa, micro, màn hình và máy tính điều khiển cho từng quy mô phòng họp.", "Hội nghị"],
];

const projectArticles = [
  ["Số hóa hồ sơ cho bộ phận kế toán", "Mô hình triển khai máy scan ADF, phân quyền thư mục và quy trình đặt tên file để giảm thời gian tìm kiếm chứng từ.", "Văn phòng"],
  ["Chuẩn hóa WiFi cho doanh nghiệp nhiều tầng", "Cách khảo sát vùng phủ, chọn access point, cấu hình VLAN khách và quản trị tập trung.", "Mạng"],
  ["Thiết lập phòng đào tạo hybrid", "Kết hợp màn hình tương tác, camera hội nghị và âm thanh phòng để hỗ trợ học trực tiếp lẫn từ xa.", "Giáo dục"],
];

const serviceArticles = [
  ["Quy trình nhận báo giá thiết bị tại HPT Tech", "Từ tiếp nhận nhu cầu, đề xuất cấu hình, báo giá đến xác nhận thời gian giao hàng và lắp đặt.", "Báo giá"],
  ["Bảo trì máy scan và máy in định kỳ gồm những gì?", "Các bước vệ sinh, kiểm tra roller, cập nhật driver, căn chỉnh chất lượng scan/in và ghi nhận tình trạng thiết bị.", "Bảo trì"],
  ["Chuẩn bị gì trước khi lắp đặt hệ thống camera?", "Những thông tin cần có về vị trí quan sát, nguồn điện, đường mạng, lưu trữ và quyền truy cập.", "Camera"],
];

const newsArticles = [
  ["5 tiêu chí chọn máy scan cho doanh nghiệp vừa và nhỏ", "Tốc độ quét, khổ giấy, nạp giấy tự động, phần mềm OCR và khả năng kết nối là các yếu tố nên cân nhắc trước khi mua.", "Tư vấn mua hàng"],
  ["Máy in laser hay máy in phun phù hợp hơn cho văn phòng?", "So sánh chi phí mực, tốc độ, chất lượng bản in và nhu cầu in màu để chọn thiết bị đúng ngân sách.", "Thiết bị văn phòng"],
  ["Vì sao doanh nghiệp nên chuẩn hóa danh mục thiết bị CNTT?", "Danh mục chuẩn giúp kiểm soát bảo hành, tồn kho, chi phí thay thế và kế hoạch nâng cấp theo từng phòng ban.", "Quản trị CNTT"],
];

const aboutArticles = [
  ["HPT Tech đồng hành cùng doanh nghiệp chuyển đổi số như thế nào?", "Tập trung vào thiết bị phù hợp, triển khai thực tế và hỗ trợ sau bán hàng để doanh nghiệp vận hành ổn định.", "Về HPT"],
  ["Cam kết chính hãng và hỗ trợ kỹ thuật", "Mỗi giải pháp được tư vấn theo nhu cầu sử dụng, ưu tiên nguồn hàng rõ ràng và quy trình bảo hành minh bạch.", "Cam kết"],
  ["Định hướng phát triển hệ sinh thái thiết bị văn phòng", "HPT Tech mở rộng nhóm sản phẩm scan, in ấn, hội nghị, giáo dục và phần mềm để phục vụ trọn vòng đời vận hành.", "Chiến lược"],
];

renderPage();

window.addEventListener("compare:updated", () => {
  if (document.body.dataset.page !== "san-pham") return;
  renderProductsPage(document.getElementById("pageBody"));
  window.lucide?.createIcons();
});
