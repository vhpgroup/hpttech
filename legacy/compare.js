const COMPARE_STORAGE_KEY = "hpttech-compare-items";
const COMPARE_LIMIT = 4;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function compareProductKey(product) {
  return encodeURIComponent(product.href || product.title || `${product.brand}-${product.price}`);
}

function normalizeCompareProduct(product) {
  return {
    key: product.key || compareProductKey(product),
    title: product.title || "Sản phẩm",
    image: product.image || "",
    price: product.price || "Liên hệ",
    brand: product.brand || "",
    category: product.category || "",
    detail: product.detail || "",
    href: product.href || "#",
  };
}

function loadCompareItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeCompareProduct).slice(0, COMPARE_LIMIT) : [];
  } catch {
    return [];
  }
}

function saveCompareItems(items) {
  localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items.slice(0, COMPARE_LIMIT)));
}

const compareCatalog = Array.isArray(window.HPT_DATA?.products)
  ? window.HPT_DATA.products.map(normalizeCompareProduct)
  : [];

const compareState = {
  items: loadCompareItems(),
  isOpen: false,
  pickerOpen: false,
  pickerQuery: "",
};

function getCompareItems() {
  return [...compareState.items];
}

function isCompared(key) {
  return compareState.items.some((item) => item.key === key);
}

function broadcastCompareChange() {
  window.dispatchEvent(new CustomEvent("compare:updated", { detail: { items: getCompareItems() } }));
}

function syncCompareButtons() {
  document.querySelectorAll("[data-compare-trigger]").forEach((button) => {
    const active = isCompared(button.dataset.compareKey);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    const text = button.querySelector(".compare-card-label");
    if (text) text.textContent = active ? "Đã chọn" : "So sánh";
  });
}

function getPickerResults() {
  const query = compareState.pickerQuery.trim().toLowerCase();
  if (query.length < 3) return [];

  return compareCatalog
    .filter((item) => !isCompared(item.key))
    .filter((item) => `${item.title} ${item.brand} ${item.category} ${item.detail}`.toLowerCase().includes(query))
    .slice(0, 16);
}

function renderPickerContent() {
  const query = compareState.pickerQuery.trim();
  const results = getPickerResults();

  if (query.length < 3) {
    return `<p class="compare-picker-message error">Vui lòng nhập tối thiểu 3 ký tự!</p>`;
  }

  if (!results.length) {
    return `<p class="compare-picker-message">Không tìm thấy sản phẩm phù hợp.</p>`;
  }

  return `
    <div class="compare-picker-results">
      ${results
        .map(
          (item) => `
            <button class="compare-picker-item" type="button" data-compare-pick="${item.key}">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />
              <span>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.brand)}${item.category ? ` - ${escapeHtml(item.category)}` : ""}</small>
              </span>
              <b>${escapeHtml(item.price)}</b>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCompareDrawer() {
  const shell = document.getElementById("compareShell");
  if (!shell) return;

  const items = compareState.items;
  const slots = Array.from({ length: COMPARE_LIMIT }, (_, index) => items[index] || null);
  const canCompare = items.length >= 2;

  shell.innerHTML = `
    <button class="compare-fab" type="button" aria-label="Mở so sánh sản phẩm" data-compare-open>
      So sánh (${items.length})
    </button>
    <div class="compare-overlay ${compareState.isOpen ? "open" : ""}" data-compare-close></div>
    <aside class="compare-drawer ${compareState.isOpen ? "open" : ""}" aria-hidden="${compareState.isOpen ? "false" : "true"}">
      <div class="compare-drawer-head">
        <h2>So sánh sản phẩm</h2>
        <button class="compare-close" type="button" aria-label="Đóng so sánh" data-compare-close>&times;</button>
      </div>
      <div class="compare-drawer-body">
        <div class="compare-slot-grid">
          ${slots
            .map((item, index) =>
              item
                ? `
                  <article class="compare-slot filled">
                    <button class="compare-remove" type="button" aria-label="Xóa ${escapeHtml(item.title)}" data-compare-remove="${item.key}">&times;</button>
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.price)}</p>
                  </article>
                `
                : `
                  <button class="compare-slot empty" type="button" data-compare-add="${index}">
                    <span class="compare-slot-plus">+</span>
                    <p>Thêm sản phẩm</p>
                  </button>
                `
            )
            .join("")}
        </div>
        <div class="compare-actions">
          <button class="compare-submit" type="button" ${canCompare ? "" : "disabled"} data-compare-submit>
            So sánh ngay
          </button>
          <button class="compare-clear ${items.length ? "" : "hidden"}" type="button" data-compare-clear>
            Xóa tất cả sản phẩm
          </button>
        </div>
      </div>
    </aside>
    <div class="compare-picker-overlay ${compareState.pickerOpen ? "open" : ""}">
      <section class="compare-picker ${compareState.pickerOpen ? "open" : ""}">
        <div class="compare-picker-head">
          <button class="compare-picker-close" type="button" data-compare-picker-close>Đóng</button>
        </div>
        <div class="compare-picker-body">
          <label class="compare-picker-search">
            <i data-lucide="search"></i>
            <input
              type="search"
              value="${escapeHtml(compareState.pickerQuery)}"
              placeholder="Nhập tên sản phẩm để tìm"
              data-compare-search-input
            />
          </label>
          <div class="compare-picker-feedback" id="comparePickerFeedback">
            ${renderPickerContent()}
          </div>
        </div>
      </section>
    </div>
  `;

  syncCompareButtons();
  window.lucide?.createIcons();

  if (compareState.pickerOpen) {
    const input = shell.querySelector("[data-compare-search-input]");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

function updatePickerFeedback() {
  const feedback = document.getElementById("comparePickerFeedback");
  if (feedback) feedback.innerHTML = renderPickerContent();
}

function openCompareDrawer() {
  compareState.isOpen = true;
  renderCompareDrawer();
}

function closeCompareDrawer() {
  compareState.isOpen = false;
  compareState.pickerOpen = false;
  renderCompareDrawer();
}

function openComparePicker() {
  compareState.isOpen = true;
  compareState.pickerOpen = true;
  compareState.pickerQuery = "";
  renderCompareDrawer();
}

function closeComparePicker() {
  compareState.pickerOpen = false;
  compareState.pickerQuery = "";
  renderCompareDrawer();
}

function toggleCompareItem(product) {
  const normalized = normalizeCompareProduct(product);
  const exists = isCompared(normalized.key);

  if (exists) {
    compareState.items = compareState.items.filter((item) => item.key !== normalized.key);
  } else {
    if (compareState.items.length >= COMPARE_LIMIT) compareState.items = compareState.items.slice(1);
    compareState.items = [...compareState.items, normalized];
    compareState.isOpen = true;
  }

  saveCompareItems(compareState.items);
  renderCompareDrawer();
  broadcastCompareChange();
}

function addCompareItemFromPicker(key) {
  const product = compareCatalog.find((item) => item.key === key);
  if (!product || isCompared(key)) return;

  compareState.items = [...compareState.items, product].slice(0, COMPARE_LIMIT);
  compareState.isOpen = true;
  compareState.pickerOpen = false;
  compareState.pickerQuery = "";
  saveCompareItems(compareState.items);
  renderCompareDrawer();
  broadcastCompareChange();
}

function removeCompareItem(key) {
  compareState.items = compareState.items.filter((item) => item.key !== key);
  compareState.isOpen = compareState.items.length > 0;
  saveCompareItems(compareState.items);
  renderCompareDrawer();
  broadcastCompareChange();
}

function clearCompareItems() {
  compareState.items = [];
  compareState.isOpen = false;
  compareState.pickerOpen = false;
  compareState.pickerQuery = "";
  saveCompareItems(compareState.items);
  renderCompareDrawer();
  broadcastCompareChange();
}

function ensureCompareShell() {
  if (document.getElementById("compareShell")) return;
  const shell = document.createElement("div");
  shell.id = "compareShell";
  document.body.appendChild(shell);
  renderCompareDrawer();
}

function readProductFromButton(button) {
  return normalizeCompareProduct({
    key: button.dataset.compareKey,
    title: button.dataset.compareTitle,
    image: button.dataset.compareImage,
    price: button.dataset.comparePrice,
    brand: button.dataset.compareBrand,
    category: button.dataset.compareCategory,
    detail: button.dataset.compareDetail,
    href: button.dataset.compareHref,
  });
}

function bindCompareEvents() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-compare-trigger]");
    if (trigger) {
      event.preventDefault();
      toggleCompareItem(readProductFromButton(trigger));
      return;
    }

    if (event.target.closest("[data-compare-open]")) {
      openCompareDrawer();
      return;
    }

    if (event.target.closest("[data-compare-close]")) {
      closeCompareDrawer();
      return;
    }

    if (event.target.closest("[data-compare-picker-close]")) {
      closeComparePicker();
      return;
    }

    if (event.target.closest("[data-compare-clear]")) {
      clearCompareItems();
      return;
    }

    const addButton = event.target.closest("[data-compare-add]");
    if (addButton) {
      openComparePicker();
      return;
    }

    const remove = event.target.closest("[data-compare-remove]");
    if (remove) {
      removeCompareItem(remove.dataset.compareRemove);
      return;
    }

    const picked = event.target.closest("[data-compare-pick]");
    if (picked) {
      addCompareItemFromPicker(picked.dataset.comparePick);
      return;
    }

    if (event.target.closest("[data-compare-submit]") && compareState.items.length >= 2) {
      window.location.href = "compare.html";
    }
  });

  document.addEventListener("input", (event) => {
    const input = event.target.closest("[data-compare-search-input]");
    if (!input) return;
    compareState.pickerQuery = input.value;
    updatePickerFeedback();
  });
}

window.HPTCompare = {
  clear: clearCompareItems,
  getItems: getCompareItems,
  getKey: compareProductKey,
  isCompared,
  open: openCompareDrawer,
  remove: removeCompareItem,
  toggle: toggleCompareItem,
};

window.addEventListener("storage", (event) => {
  if (event.key !== COMPARE_STORAGE_KEY) return;
  compareState.items = loadCompareItems();
  renderCompareDrawer();
  broadcastCompareChange();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ensureCompareShell();
    bindCompareEvents();
    broadcastCompareChange();
  });
} else {
  ensureCompareShell();
  bindCompareEvents();
  broadcastCompareChange();
}
