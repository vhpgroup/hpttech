const COMPARE_STORAGE_KEY = "hpttech-compare-items";
const SPEC_FALLBACK_ORDER = [
  "Loại máy",
  "Khổ giấy",
  "Tốc độ quét",
  "Tốc độ in",
  "ADF",
  "Quét hai mặt",
  "In hai mặt",
  "Kết nối",
  "Độ phân giải quang học",
  "Công suất ngày",
  "Chức năng",
  "Nguồn điện",
  "Bộ nhớ",
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadCompareItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSpecsMap() {
  return window.HPT_PRODUCT_SPECS || {};
}

function enrichItems(items) {
  const specsMap = getSpecsMap();
  return items.map((item) => ({
    ...item,
    specs: specsMap[item.href] || item.specs || {},
  }));
}

function buildRows(items) {
  const labels = new Set();
  items.forEach((item) => {
    Object.keys(item.specs || {}).forEach((label) => labels.add(label));
  });

  const orderedLabels = [
    ...SPEC_FALLBACK_ORDER.filter((label) => labels.has(label)),
    ...[...labels].filter((label) => !SPEC_FALLBACK_ORDER.includes(label)).sort(),
  ];

  const rows = [
    ["Thương hiệu", items.map((item) => escapeHtml(item.brand || "Đang cập nhật"))],
    ["Danh mục", items.map((item) => escapeHtml(item.category || "Đang cập nhật"))],
  ];

  if (orderedLabels.length) {
    orderedLabels.forEach((label) => {
      rows.push([label, items.map((item) => escapeHtml((item.specs && item.specs[label]) || "Đang cập nhật"))]);
    });
  } else {
    rows.push(["Mô tả", items.map((item) => escapeHtml(item.detail || "Đang cập nhật"))]);
  }

  rows.push(["Giá", items.map((item) => escapeHtml(item.price || "Liên hệ"))]);
  rows.push([
    "Liên kết",
    items.map(
      (item) =>
        `<a href="${escapeHtml(item.href || "#")}" target="_blank" rel="noreferrer" class="compare-link">Xem sản phẩm</a>`
    ),
  ]);

  return rows;
}

function renderComparePage() {
  const target = document.getElementById("comparePageContent");
  if (!target) return;

  const items = enrichItems(loadCompareItems());

  if (items.length < 2) {
    target.innerHTML = `
      <div class="compare-page-empty">
        <h2>Chưa đủ sản phẩm để so sánh</h2>
        <p>Hãy chọn ít nhất 2 sản phẩm từ trang chủ hoặc trang danh mục.</p>
        <a class="compare-page-back primary" href="san-pham.html">Đi tới danh mục sản phẩm</a>
      </div>
    `;
    return;
  }

  const rows = buildRows(items)
    .map(
      ([label, values]) => `
        <tr>
          <th>${label}</th>
          ${values.map((value) => `<td>${value}</td>`).join("")}
        </tr>
      `
    )
    .join("");

  target.innerHTML = `
    <div class="compare-page-table-wrap">
      <table class="compare-page-table">
        <thead>
          <tr>
            <th>Thuộc tính</th>
            ${items
              .map(
                (item) => `
                  <th>
                    <img src="${escapeHtml(item.image || "")}" alt="${escapeHtml(item.title || "Sản phẩm")}" />
                    <strong>${escapeHtml(item.title || "Sản phẩm")}</strong>
                  </th>
                `
              )
              .join("")}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

renderComparePage();
