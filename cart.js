const CART_STORAGE_KEY = "hpttech-cart-items";

function escapeCartHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cartProductKey(product) {
  return encodeURIComponent(product.href || product.title || `${product.brand}-${product.price}`);
}

function normalizeCartProduct(product) {
  return {
    key: product.key || cartProductKey(product),
    title: product.title || "Sản phẩm",
    image: product.image || "",
    price: product.price || "Liên hệ",
    brand: product.brand || "",
    category: product.category || "",
    detail: product.detail || "",
    href: product.href || "#",
    qty: Math.max(1, Number(product.qty) || 1),
  };
}

function loadCartItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeCartProduct) : [];
  } catch {
    return [];
  }
}

function saveCartItems(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.map(normalizeCartProduct)));
}

const cartState = {
  items: loadCartItems(),
  isOpen: false,
};

function getCartCount() {
  return cartState.items.reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotalLabel() {
  if (!cartState.items.length) return "Chưa có sản phẩm";
  return `${getCartCount()} sản phẩm`;
}

function syncCartBadges() {
  const count = getCartCount();
  document.querySelectorAll(".cart").forEach((button) => {
    const badge = button.querySelector("span");
    if (badge) badge.textContent = String(count);
    button.setAttribute("aria-label", `Giỏ hàng (${count})`);
  });
}

function ensureCartShell() {
  if (document.getElementById("cartShell")) return;
  const shell = document.createElement("div");
  shell.id = "cartShell";
  document.body.appendChild(shell);
}

function renderCartDrawer() {
  const shell = document.getElementById("cartShell");
  if (!shell) return;

  const itemMarkup = cartState.items.length
    ? cartState.items
        .map(
          (item) => `
            <article class="cart-item">
              <a class="cart-item-image" href="${escapeCartHtml(item.href)}" target="_blank" rel="noreferrer">
                <img src="${escapeCartHtml(item.image)}" alt="${escapeCartHtml(item.title)}" />
              </a>
              <div class="cart-item-copy">
                <strong>${escapeCartHtml(item.title)}</strong>
                <small>${escapeCartHtml(item.brand)}${item.category ? ` - ${escapeCartHtml(item.category)}` : ""}</small>
                <b>${escapeCartHtml(item.price)}</b>
                <div class="cart-item-actions">
                  <div class="cart-item-qty">
                    <button type="button" data-cart-qty="${item.key}" data-cart-step="-1" aria-label="Giảm số lượng">-</button>
                    <span>${item.qty}</span>
                    <button type="button" data-cart-qty="${item.key}" data-cart-step="1" aria-label="Tăng số lượng">+</button>
                  </div>
                  <button class="cart-item-remove" type="button" data-cart-remove="${item.key}">Xóa</button>
                </div>
              </div>
            </article>
          `
        )
        .join("")
    : `<div class="cart-empty">
        <i data-lucide="shopping-cart"></i>
        <h3>Giỏ hàng đang trống</h3>
        <p>Chọn sản phẩm phù hợp rồi thêm vào giỏ để theo dõi nhanh.</p>
      </div>`;

  shell.innerHTML = `
    <div class="cart-overlay ${cartState.isOpen ? "open" : ""}" data-cart-close></div>
    <aside class="cart-drawer ${cartState.isOpen ? "open" : ""}" aria-hidden="${cartState.isOpen ? "false" : "true"}">
      <div class="cart-drawer-head">
        <div>
          <h2>Giỏ hàng</h2>
          <small>${getCartTotalLabel()}</small>
        </div>
        <button type="button" class="cart-drawer-close" data-cart-close aria-label="Đóng giỏ hàng">&times;</button>
      </div>
      <div class="cart-drawer-body">
        ${itemMarkup}
      </div>
      <div class="cart-drawer-foot">
        <button type="button" class="cart-secondary" data-cart-clear ${cartState.items.length ? "" : "disabled"}>Xóa tất cả</button>
        <a class="cart-primary" href="lien-he.html">Yêu cầu báo giá</a>
      </div>
    </aside>
  `;

  syncCartBadges();
  window.lucide?.createIcons();
}

function broadcastCartUpdate() {
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: { items: [...cartState.items] } }));
}

function openCartDrawer() {
  cartState.isOpen = true;
  renderCartDrawer();
}

function closeCartDrawer() {
  cartState.isOpen = false;
  renderCartDrawer();
}

function addCartItem(product) {
  const normalized = normalizeCartProduct(product);
  const existing = cartState.items.find((item) => item.key === normalized.key);

  if (existing) {
    existing.qty += 1;
  } else {
    cartState.items = [...cartState.items, normalized];
  }

  saveCartItems(cartState.items);
  cartState.isOpen = true;
  renderCartDrawer();
  broadcastCartUpdate();
}

function updateCartItemQty(key, step) {
  cartState.items = cartState.items
    .map((item) => (item.key === key ? { ...item, qty: item.qty + step } : item))
    .filter((item) => item.qty > 0);
  saveCartItems(cartState.items);
  renderCartDrawer();
  broadcastCartUpdate();
}

function removeCartItem(key) {
  cartState.items = cartState.items.filter((item) => item.key !== key);
  saveCartItems(cartState.items);
  renderCartDrawer();
  broadcastCartUpdate();
}

function clearCartItems() {
  cartState.items = [];
  saveCartItems(cartState.items);
  renderCartDrawer();
  broadcastCartUpdate();
}

function readCartProductFromButton(button) {
  return normalizeCartProduct({
    key: button.dataset.cartKey,
    title: button.dataset.cartTitle,
    image: button.dataset.cartImage,
    price: button.dataset.cartPrice,
    brand: button.dataset.cartBrand,
    category: button.dataset.cartCategory,
    detail: button.dataset.cartDetail,
    href: button.dataset.cartHref,
  });
}

function bindCartEvents() {
  document.addEventListener("click", (event) => {
    const cartButton = event.target.closest(".cart");
    if (cartButton) {
      event.preventDefault();
      openCartDrawer();
      return;
    }

    const addButton = event.target.closest("[data-cart-add]");
    if (addButton) {
      event.preventDefault();
      addCartItem(readCartProductFromButton(addButton));
      return;
    }

    if (event.target.closest("[data-cart-close]")) {
      closeCartDrawer();
      return;
    }

    const qtyButton = event.target.closest("[data-cart-qty]");
    if (qtyButton) {
      event.preventDefault();
      updateCartItemQty(qtyButton.dataset.cartQty, Number(qtyButton.dataset.cartStep) || 0);
      return;
    }

    const removeButton = event.target.closest("[data-cart-remove]");
    if (removeButton) {
      event.preventDefault();
      removeCartItem(removeButton.dataset.cartRemove);
      return;
    }

    if (event.target.closest("[data-cart-clear]")) {
      event.preventDefault();
      clearCartItems();
    }
  });
}

window.addEventListener("storage", (event) => {
  if (event.key !== CART_STORAGE_KEY) return;
  cartState.items = loadCartItems();
  renderCartDrawer();
  broadcastCartUpdate();
});

window.HPTCart = {
  add: addCartItem,
  clear: clearCartItems,
  count: getCartCount,
  getItems: () => [...cartState.items],
  open: openCartDrawer,
  remove: removeCartItem,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ensureCartShell();
    bindCartEvents();
    renderCartDrawer();
    broadcastCartUpdate();
  });
} else {
  ensureCartShell();
  bindCartEvents();
  renderCartDrawer();
  broadcastCartUpdate();
}
