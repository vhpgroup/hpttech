const data = window.HPT_DATA;

const iconName = {
  laptop: "laptop",
  monitor: "monitor",
  server: "server",
  network: "network",
  printer: "printer",
  video: "video",
  cctv: "cctv",
  "graduation-cap": "graduation-cap",
  "badge-check": "badge-check",
  cable: "cable",
  "scan-line": "scan-line",
  droplets: "droplets",
  "hard-drive": "hard-drive",
  wrench: "wrench",
  workflow: "workflow",
  copy: "copy",
  projector: "projector",
  "battery-charging": "battery-charging",
  database: "database",
  package: "package",
  "file-search": "file-search",
  keyboard: "keyboard",
};

const categoryMegaMenu = {
  "Laptop doanh nghiệp": {
    columns: [
      { title: "Laptop", items: ["Laptop doanh nghiệp", "Laptop văn phòng", "Laptop di động", "Laptop hiệu năng cao"] },
      { title: "Máy bộ", items: ["Máy bộ", "PC văn phòng", "PC học tập", "PC làm việc"] },
      { title: "Màn hình", items: ["Màn hình", "Màn hình văn phòng", "Màn hình doanh nghiệp", "Màn hình đồ họa"] },
      { title: "Theo nhu cầu", items: ["Làm việc văn phòng", "Di chuyển nhiều", "Thiết kế", "Doanh nghiệp SMB"] },
      { title: "Phụ kiện", items: ["Linh kiện", "Thiết bị lưu trữ", "Tablet", "Sản phẩm cũ"] },
    ],
  },
  "Máy tính để bàn": {
    columns: [
      { title: "Máy bộ", items: ["Máy bộ", "Máy bộ doanh nghiệp", "Máy bộ văn phòng", "Máy bộ học tập"] },
      { title: "Máy chủ", items: ["Máy chủ", "Máy chủ tower", "Máy chủ rack", "Lưu trữ doanh nghiệp"] },
      { title: "Màn hình", items: ["Màn hình", "Màn hình máy tính", "Màn hình làm việc", "Màn hình thiết kế"] },
      { title: "Linh kiện", items: ["Linh kiện", "Thiết bị lưu trữ", "UPS", "Sản phẩm cũ"] },
    ],
  },
  "Máy chủ & Storage": {
    columns: [
      { title: "Máy chủ", items: ["Máy chủ", "Máy chủ rack", "Máy chủ tower", "Máy chủ doanh nghiệp"] },
      { title: "Thiết bị lưu trữ", items: ["Thiết bị lưu trữ", "Ổ cứng lưu trữ", "SSD", "NAS"] },
      { title: "Lưu điện", items: ["Lưu điện", "UPS online", "UPS offline", "UPS cho server"] },
      { title: "Giải pháp", items: ["Sao lưu dữ liệu", "Lưu trữ nội bộ", "Ảo hóa", "Hạ tầng CNTT"] },
    ],
  },
  "Thiết bị mạng": {
    columns: [
      { title: "Thiết bị mạng", items: ["Switch", "Router", "Firewall", "Access Point", "Thiết bị lưu trữ", "Lưu điện"] },
      { title: "Camera quan sát", items: ["Camera quan sát", "Đầu ghi", "Lưu trữ camera", "An ninh văn phòng"] },
      { title: "Nhà thông minh", items: ["Nhà thông minh", "Điều khiển thông minh", "Cảm biến", "Tự động hóa"] },
      { title: "Dịch vụ", items: ["Thi công mạng", "Khảo sát hạ tầng", "Bảo trì định kỳ", "Triển khai doanh nghiệp"] },
    ],
  },
  "Thiết bị văn phòng": {
    columns: [
      { title: "Máy in", items: ["Máy in", "Máy in laser", "Máy in màu", "Máy in đa năng"] },
      { title: "Mực in", items: ["Mực in", "Vật tư máy in", "Linh kiện thay thế", "Giấy in"] },
      { title: "Máy Scan", items: ["Máy Scan", "Máy Scan A3", "Máy Scan văn phòng", "Máy Scan tốc độ cao"] },
      { title: "Photocopy", items: ["Photocopy", "Máy hút giấy", "Dịch vụ", "Sản phẩm cũ"] },
    ],
  },
  "Thiết bị hội nghị": {
    columns: [
      { title: "Máy chiếu", items: ["Máy chiếu", "Máy chiếu văn phòng", "Máy chiếu lớp học", "Màn chiếu"] },
      { title: "Âm thanh", items: ["Âm thanh", "Loa", "Micro", "Thiết bị AV"] },
      { title: "Thiết bị hội nghị", items: ["Camera họp", "Thiết bị phòng họp", "Màn hình trình chiếu", "Hybrid meeting"] },
      { title: "Giải pháp", items: ["Phòng họp trực tuyến", "Dạy học trực tuyến", "Trình chiếu", "Tích hợp AV"] },
    ],
  },
  "Camera & An ninh": {
    columns: [
      { title: "Camera quan sát", items: ["Camera trong nhà", "Camera ngoài trời", "Camera IP", "Camera AI"] },
      { title: "An ninh", items: ["Đầu ghi", "Lưu trữ camera", "Báo động", "Giám sát doanh nghiệp"] },
      { title: "Nhà thông minh", items: ["Nhà thông minh", "Khóa thông minh", "Cảm biến", "Điều khiển từ xa"] },
      { title: "Triển khai", items: ["Văn phòng", "Nhà xưởng", "Trường học", "Cửa hàng"] },
    ],
  },
  "Thiết bị giáo dục": {
    columns: [
      { title: "Lớp học số", items: ["Màn hình tương tác", "Máy chiếu", "Camera vật thể", "Thiết bị lớp học"] },
      { title: "Trình chiếu", items: ["Máy chiếu", "Âm thanh", "Thiết bị ghi hình", "Bảng tương tác"] },
      { title: "Giải pháp", items: ["Dạy học trực tuyến", "Phòng lab", "Lớp học hybrid", "Số hóa giáo dục"] },
      { title: "Thiết bị bổ trợ", items: ["Tablet", "Màn hình", "Âm thanh", "Phần mềm"] },
    ],
  },
  "Phần mềm bản quyền": {
    columns: [
      { title: "Phần mềm", items: ["Phần mềm", "Office", "Windows", "Phần mềm doanh nghiệp"] },
      { title: "Bảo mật", items: ["Antivirus", "Endpoint security", "Firewall license", "Bảo mật email"] },
      { title: "Theo nhu cầu", items: ["Doanh nghiệp", "Trường học", "Cơ quan nhà nước", "SME"] },
      { title: "Dịch vụ", items: ["Tư vấn bản quyền", "Gia hạn license", "Triển khai", "Hỗ trợ kỹ thuật"] },
    ],
  },
  "Linh kiện & Phụ kiện": {
    columns: [
      { title: "Linh kiện", items: ["Linh kiện", "RAM", "SSD", "Ổ cứng"] },
      { title: "Thiết bị lưu trữ", items: ["Thiết bị lưu trữ", "USB", "Ổ cứng di động", "Thẻ nhớ"] },
      { title: "Phụ kiện", items: ["Chuột", "Bàn phím", "Tai nghe", "Cáp kết nối"] },
      { title: "Theo thiết bị", items: ["Laptop", "PC", "Máy in", "Màn hình"] },
    ],
  },
};

let activeBanner = 0;
let bannerTimer;
let activeProducts = data.products;
let activeProductPage = 1;
let activeProductTab = data.productTabs[0] || "Nổi bật";
let activeProductQuery = "";
const productsPerPage = 10;

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

function renderCategoryMenu() {
  const panel = document.getElementById("categoryPanel");
  if (!panel) return;

  panel.innerHTML =
    data.categories
      .map(([name, icon], index) => {
        const mega = categoryMegaMenu[name];
        return `
          <article class="category-item" style="--menu-index:${index}">
            <a href="san-pham.html">
              <i data-lucide="${iconName[icon] || "box"}"></i>
              <span>${name}</span>
            </a>
            ${
              mega
                ? `
                  <div class="category-mega-panel">
                    <div class="category-mega-grid">
                      ${mega.columns
                        .map(
                          (column) => `
                            <section class="category-mega-col">
                              <h3>${column.title}</h3>
                              <div>
                                ${column.items.map((item) => `<a href="san-pham.html">${item}</a>`).join("")}
                              </div>
                            </section>
                          `
                        )
                        .join("")}
                    </div>
                  </div>
                `
                : ""
            }
          </article>
        `;
      })
      .join("") +
    `<article class="category-item"><a href="san-pham.html"><i data-lucide="grid-3x3"></i><span>Xem tất cả danh mục</span></a></article>`;
}

function render() {
  renderBanners();
  renderCategoryMenu();
  document.querySelectorAll(".commercial-tile-image").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
    }, { once: true });
  });

  document.getElementById("brandLogos").innerHTML = data.brands
    .map((brand) => `<span><img src="${brand.logo}" alt="${brand.name}" loading="lazy" /><b>${brand.name}</b></span>`)
    .join("");

  document.getElementById("productTabs").innerHTML = data.productTabs
    .map((tab, index) => `<button class="${index === 0 ? "active" : ""}" type="button" data-tab="${tab}">${tab}</button>`)
    .join("");

  renderProducts(data.products);

  document.getElementById("solutionGrid").innerHTML = data.solutions
    .map(
      ([title, text, icon]) => `
        <article class="solution-card">
          <i data-lucide="${icon}"></i>
          <h3>${title}</h3>
          <p>${text}</p>
          <a href="#contact">Xem chi tiết <i data-lucide="arrow-right"></i></a>
        </article>
      `
    )
    .join("");

  document.getElementById("newsGrid").innerHTML = data.posts
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
    .join("");

  attachEvents();
  window.lucide?.createIcons();
}

function renderBanners() {
  const image = document.getElementById("heroBannerImage");
  const dots = document.getElementById("heroDots");
  image.src = data.banners[activeBanner];

  if (!dots) {
    startBannerTimer();
    return;
  }

  dots.innerHTML = data.banners
    .map((_, index) => `<button class="${index === activeBanner ? "active" : ""}" type="button" data-banner="${index}" aria-label="Banner ${index + 1}"></button>`)
    .join("");

  dots.querySelectorAll("[data-banner]").forEach((button) => {
    button.addEventListener("click", () => {
      setBanner(Number(button.dataset.banner));
      startBannerTimer();
    });
  });

  startBannerTimer();
}

function setBanner(index) {
  activeBanner = index;
  document.getElementById("heroBannerImage").src = data.banners[activeBanner];
  document.querySelectorAll("[data-banner]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.banner) === activeBanner);
  });
}

function startBannerTimer() {
  clearInterval(bannerTimer);
  bannerTimer = setInterval(() => {
    setBanner((activeBanner + 1) % data.banners.length);
  }, 4500);
}

function renderProducts(products) {
  activeProducts = products;
  const totalPages = Math.max(1, Math.ceil(activeProducts.length / productsPerPage));
  activeProductPage = Math.min(activeProductPage, totalPages);
  const start = (activeProductPage - 1) * productsPerPage;
  const visibleProducts = activeProducts.slice(start, start + productsPerPage);

  document.getElementById("productGrid").innerHTML = visibleProducts
    .map(
      (product) => `
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
      `
    )
    .join("");

  renderPagination(totalPages);
  window.lucide?.createIcons();
}

function renderPagination(totalPages) {
  const pagination = document.getElementById("productPagination");
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  pagination.innerHTML = `
    <button type="button" ${activeProductPage === 1 ? "disabled" : ""} data-page="${activeProductPage - 1}" aria-label="Trang trước">
      <i data-lucide="chevron-left"></i>
    </button>
    ${Array.from({ length: totalPages }, (_, index) => {
      const page = index + 1;
      return `<button class="${page === activeProductPage ? "active" : ""}" type="button" data-page="${page}">${page}</button>`;
    }).join("")}
    <button type="button" ${activeProductPage === totalPages ? "disabled" : ""} data-page="${activeProductPage + 1}" aria-label="Trang sau">
      <i data-lucide="chevron-right"></i>
    </button>
  `;

  pagination.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      activeProductPage = Number(button.dataset.page);
      renderProducts(activeProducts);
    });
  });
}

function attachEvents() {
  document.querySelector(".search")?.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeProductTab = button.dataset.tab;
      activeProductPage = 1;
      renderProducts(getFilteredProducts());
    });
  });

  const searchInputs = [document.getElementById("searchInput"), document.getElementById("productSearchInput")].filter(Boolean);
  searchInputs.forEach((input) => {
    input.addEventListener("input", (event) => {
      activeProductQuery = event.target.value.trim().toLowerCase();
      searchInputs.forEach((otherInput) => {
        if (otherInput !== event.target) otherInput.value = event.target.value;
      });
      activeProductPage = 1;
      renderProducts(getFilteredProducts());
    });
  });
}

function getFilteredProducts() {
  const featuredTab = data.productTabs[0] || "Nổi bật";
  const tabFiltered =
    activeProductTab === featuredTab
      ? data.products
      : data.products.filter((item) => item.category === activeProductTab || item.brand === activeProductTab);

  if (!activeProductQuery) {
    return tabFiltered.length ? tabFiltered : data.products;
  }

  const filtered = tabFiltered.filter((item) =>
    `${item.title} ${item.detail} ${item.brand} ${item.category}`.toLowerCase().includes(activeProductQuery)
  );

  if (filtered.length) return filtered;

  return data.products.filter((item) =>
    `${item.title} ${item.detail} ${item.brand} ${item.category}`.toLowerCase().includes(activeProductQuery)
  );
}

render();

window.addEventListener("compare:updated", () => {
  renderProducts(getFilteredProducts());
});
