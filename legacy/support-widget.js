const SUPPORT_CONFIG = {
  zaloHref: "https://zalo.me/0876645432",
  facebookHref: "https://www.facebook.com/solarangelx9/",
  supportHours: "8:30 - 17:30",
  hotline: "0876 645 432",
  apiEndpoint: "/api/chat",
  companyName: "HPT Tech",
  companyLogo: "https://hpttech.vn/media/32/content/HPT-Logo.png",
  zaloIcon: "assets/icons/zalo.png",
  messengerIcon: "assets/icons/messenger.png",
  chatbotIcon: "assets/icons/bot.png",
};

const SUPPORT_STORAGE_KEY = "hpttech-support-chat";
const SUPPORT_FALLBACK_MESSAGE =
  "Hệ thống chat đang tạm thời gián đoạn. Quý khách vui lòng liên hệ hotline 0876 645 432 hoặc Zalo/Facebook để được hỗ trợ ngay.";
const SUPPORT_INTRO_MESSAGE = "Em đang online ạ. Anh/chị vui lòng để lại nội dung cần hỗ trợ, em sẽ phản hồi ngay.";
const SUPPORT_LEAD_PROMPT = "Cho em xin thông tin anh/chị để tiện hỗ trợ.";

const defaultLeadForm = () => ({
  name: "",
  phone: "",
  service: "",
});

const supportState = {
  chatbotOpen: false,
  loading: false,
  leadFormOpen: false,
  leadCaptured: false,
  pendingInitialMessage: "",
  leadData: null,
  leadForm: defaultLeadForm(),
  leadErrors: {},
  messages: [{ role: "bot", text: SUPPORT_INTRO_MESSAGE }],
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cloneSupportStateForStorage() {
  return {
    messages: supportState.messages,
    leadCaptured: supportState.leadCaptured,
    leadData: supportState.leadData,
    pendingInitialMessage: supportState.pendingInitialMessage,
    leadForm: supportState.leadForm,
    updatedAt: new Date().toISOString(),
  };
}

function saveSupportState() {
  try {
    localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(cloneSupportStateForStorage()));
  } catch {}
}

function loadSupportState() {
  try {
    const raw = localStorage.getItem(SUPPORT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.messages) && parsed.messages.length) {
      supportState.messages = parsed.messages.filter(
        (message) => message && (message.role === "bot" || message.role === "user") && typeof message.text === "string"
      );
    }
    supportState.leadCaptured = Boolean(parsed.leadCaptured);
    supportState.leadData = parsed.leadData && typeof parsed.leadData === "object" ? parsed.leadData : null;
    supportState.pendingInitialMessage =
      typeof parsed.pendingInitialMessage === "string" ? parsed.pendingInitialMessage : "";
    supportState.leadForm = parsed.leadForm && typeof parsed.leadForm === "object" ? parsed.leadForm : defaultLeadForm();
    supportState.leadFormOpen = Boolean(supportState.pendingInitialMessage && !supportState.leadCaptured);
  } catch {}
}

function renderSupportMessages() {
  const messages = supportState.messages
    .map((message) => {
      const isBot = message.role === "bot";
      const avatar = isBot
        ? `
          <div class="support-chat-avatar" aria-hidden="true">
            <img src="${SUPPORT_CONFIG.companyLogo}" alt="${escapeHtml(SUPPORT_CONFIG.companyName)}" />
          </div>
        `
        : "";

      return `
        <div class="support-chat-message ${message.role}">
          ${avatar}
          <div class="support-chat-content">
            <div class="support-chat-bubble">${escapeHtml(message.text)}</div>
          </div>
        </div>
      `;
    })
    .join("");

  const loadingBubble = supportState.loading
    ? `
      <div class="support-chat-message bot loading">
        <div class="support-chat-avatar" aria-hidden="true">
          <img src="${SUPPORT_CONFIG.companyLogo}" alt="${escapeHtml(SUPPORT_CONFIG.companyName)}" />
        </div>
        <div class="support-chat-content">
          <div class="support-chat-bubble support-chat-typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `
    : "";

  return messages + loadingBubble;
}

function renderLeadForm() {
  if (!supportState.leadFormOpen) return "";

  return `
    <form class="support-lead-form" id="supportLeadForm">
      <h3>Thông tin cơ bản</h3>
      <label class="support-lead-field">
        <input
          id="supportLeadName"
          name="name"
          type="text"
          placeholder="Nhập tên của bạn *"
          value="${escapeHtml(supportState.leadForm.name)}"
        />
        ${supportState.leadErrors.name ? `<small>${escapeHtml(supportState.leadErrors.name)}</small>` : ""}
      </label>
      <label class="support-lead-field">
        <input
          id="supportLeadPhone"
          name="phone"
          type="tel"
          placeholder="Nhập số điện thoại của bạn *"
          value="${escapeHtml(supportState.leadForm.phone)}"
        />
        ${supportState.leadErrors.phone ? `<small>${escapeHtml(supportState.leadErrors.phone)}</small>` : ""}
      </label>
      <label class="support-lead-field">
        <select id="supportLeadService" name="service">
          <option value="">--- Chọn 1 dịch vụ hỗ trợ ---</option>
          <option value="Báo giá sản phẩm" ${supportState.leadForm.service === "Báo giá sản phẩm" ? "selected" : ""}>Báo giá sản phẩm</option>
          <option value="Tư vấn giải pháp" ${supportState.leadForm.service === "Tư vấn giải pháp" ? "selected" : ""}>Tư vấn giải pháp</option>
          <option value="Hỗ trợ kỹ thuật" ${supportState.leadForm.service === "Hỗ trợ kỹ thuật" ? "selected" : ""}>Hỗ trợ kỹ thuật</option>
          <option value="Khác" ${supportState.leadForm.service === "Khác" ? "selected" : ""}>Khác</option>
        </select>
      </label>
      <button type="submit" class="support-lead-submit">Bắt đầu trò chuyện</button>
    </form>
  `;
}

function renderSupportWidget() {
  const shell = document.getElementById("supportWidgetShell");
  if (!shell) return;

  shell.innerHTML = `
    <div class="support-widget">
      <div class="support-stack open">
        <a class="support-card zalo" href="${SUPPORT_CONFIG.zaloHref}" target="_blank" rel="noreferrer">
          <span class="support-card-icon zalo">
            <img
              src="${SUPPORT_CONFIG.zaloIcon}"
              alt="Zalo"
              class="support-card-icon-zalo-image"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"
            />
            <span class="support-card-icon-zalo-text" style="display:none;">Zalo</span>
          </span>
          <span class="support-card-copy">
            <strong>Tư vấn Zalo</strong>
            <small>(${SUPPORT_CONFIG.supportHours})</small>
          </span>
        </a>
        <a class="support-card facebook" href="${SUPPORT_CONFIG.facebookHref}" target="_blank" rel="noreferrer">
          <span class="support-card-icon facebook">
            <img
              src="${SUPPORT_CONFIG.messengerIcon}"
              alt="Messenger"
              class="support-card-icon-messenger-image"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"
            />
            <i data-lucide="message-circle-more" style="display:none;"></i>
          </span>
          <span class="support-card-copy">
            <strong>Chat Facebook</strong>
            <small>(${SUPPORT_CONFIG.supportHours})</small>
          </span>
        </a>
        <button class="support-card chatbot" type="button" data-support-open-chatbot>
          <img
            src="${SUPPORT_CONFIG.chatbotIcon}"
            alt="Hỗ trợ Online"
            class="support-card-chatbot-banner"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <span class="support-card-chatbot-fallback" style="display:none;">
            <i data-lucide="bot"></i>
            <strong>Hỗ trợ Online</strong>
          </span>
        </button>
      </div>
    </div>

    <div class="support-chatbot ${supportState.chatbotOpen ? "open" : ""}">
      <div class="support-chatbot-head">
        <button type="button" class="support-chatbot-menu" aria-label="Mở menu">
          <i data-lucide="menu"></i>
        </button>
        <div class="support-chatbot-brand">
          <div class="support-chatbot-logo">
            <img src="${SUPPORT_CONFIG.companyLogo}" alt="${escapeHtml(SUPPORT_CONFIG.companyName)}" />
          </div>
          <div>
            <strong>${escapeHtml(SUPPORT_CONFIG.companyName)}</strong>
            <small>Agent online</small>
          </div>
        </div>
        <button type="button" class="support-chatbot-close" data-support-close-chatbot aria-label="Đóng chatbot">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="support-chatbot-body">
        <div class="support-chatbot-messages" id="supportChatMessages">${renderSupportMessages()}</div>
        ${renderLeadForm()}
        <form class="support-chatbot-form" id="supportChatForm">
          <input
            id="supportChatInput"
            type="text"
            placeholder="${supportState.leadFormOpen ? "Vui lòng hoàn tất thông tin trước..." : "Nhập nội dung cần hỗ trợ..."}"
            ${supportState.loading || supportState.leadFormOpen ? "disabled" : ""}
          />
          <button type="submit" aria-label="Gửi tin nhắn" ${supportState.loading || supportState.leadFormOpen ? "disabled" : ""}>
            <i data-lucide="send-horizontal"></i>
          </button>
        </form>
      </div>
    </div>
  `;

  window.lucide?.createIcons();
}

function appendSupportMessage(role, text) {
  supportState.messages.push({ role, text });
  saveSupportState();
  renderSupportWidget();
  scrollSupportChatToBottom();
}

function scrollSupportChatToBottom() {
  const el = document.getElementById("supportChatMessages");
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
}

function ensureSupportWidget() {
  if (document.getElementById("supportWidgetShell")) return;
  const shell = document.createElement("div");
  shell.id = "supportWidgetShell";
  document.body.appendChild(shell);
  renderSupportWidget();
}

function getRecentConversation(limit = 8) {
  return supportState.messages.slice(-limit).map((message) => ({
    role: message.role === "bot" ? "assistant" : "user",
    content: message.text,
  }));
}

function getLeadCaptureConversation() {
  const firstBotMessage = supportState.messages.find((message) => message.role === "bot");
  return firstBotMessage
    ? [
        {
          role: "assistant",
          content: firstBotMessage.text,
        },
      ]
    : [];
}

function getRelevantProducts(message) {
  const products = Array.isArray(window.HPT_DATA?.products) ? window.HPT_DATA.products : [];
  const keywords = message
    .toLowerCase()
    .split(/[\s,.;:!?()]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);

  return products
    .map((product) => {
      const haystack = `${product.title} ${product.brand} ${product.category} ${product.detail}`.toLowerCase();
      const score = keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? 1 : 0), 0);
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ product }) => ({
      title: product.title,
      brand: product.brand,
      category: product.category,
      price: product.price,
      detail: product.detail,
      href: product.href,
    }));
}

function getFriendlyChatError(message) {
  const text = String(message || "").toLowerCase();
  if (!text) return SUPPORT_FALLBACK_MESSAGE;

  const technicalMarkers = [
    "openai_api_key",
    "api key",
    "openai",
    "server",
    "network",
    "fetch",
    "timeout",
    "connection",
    "rate limit",
    "quota",
    "401",
    "403",
    "429",
    "500",
    "502",
    "503",
  ];

  return technicalMarkers.some((marker) => text.includes(marker)) ? SUPPORT_FALLBACK_MESSAGE : String(message);
}

async function requestOpenAIReply(message, options = {}) {
  const response = await fetch(SUPPORT_CONFIG.apiEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation: options.conversation || getRecentConversation(),
      relevantProducts: getRelevantProducts(message),
      page: window.location.pathname,
      customerInfo: supportState.leadData,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(getFriendlyChatError(payload.error));
  }

  const payload = await response.json();
  if (!payload.reply) throw new Error("Hiện chưa nhận được phản hồi từ hệ thống chat.");
  return payload.reply;
}

function getUserMessageCount() {
  return supportState.messages.filter((message) => message.role === "user").length;
}

async function requestBotReply(message, options = {}) {
  supportState.loading = true;
  renderSupportWidget();
  scrollSupportChatToBottom();

  try {
    const reply = await requestOpenAIReply(message, options);
    appendSupportMessage("bot", reply);
  } catch (error) {
    appendSupportMessage("bot", getFriendlyChatError(error.message));
  } finally {
    supportState.loading = false;
    renderSupportWidget();
    scrollSupportChatToBottom();
  }
}

function openLeadFormForInitialMessage(message) {
  supportState.pendingInitialMessage = message;
  supportState.leadFormOpen = true;
  supportState.leadErrors = {};
  supportState.leadForm = {
    ...defaultLeadForm(),
    service: "Tư vấn giải pháp",
  };
  appendSupportMessage("bot", SUPPORT_LEAD_PROMPT);
  saveSupportState();
  renderSupportWidget();
  scrollSupportChatToBottom();
}

async function submitSupportMessage(text) {
  const message = text.trim();
  if (!message || supportState.loading) return;

  appendSupportMessage("user", message);

  if (!supportState.leadCaptured && getUserMessageCount() === 1) {
    openLeadFormForInitialMessage(message);
    return;
  }

  await requestBotReply(message);
}

function validateLeadForm() {
  const errors = {};
  const name = supportState.leadForm.name.trim();
  const phone = supportState.leadForm.phone.trim();

  if (!name) errors.name = "Tên chưa được nhập.";
  if (!phone) errors.phone = "Số điện thoại chưa được nhập.";
  else if (!/^(0|\+84)[0-9]{8,10}$/.test(phone.replace(/\s+/g, ""))) errors.phone = "Số điện thoại không hợp lệ.";

  supportState.leadErrors = errors;
  return Object.keys(errors).length === 0;
}

async function submitLeadForm() {
  if (!validateLeadForm()) {
    renderSupportWidget();
    return;
  }

  supportState.leadCaptured = true;
  supportState.leadFormOpen = false;
  supportState.leadData = {
    name: supportState.leadForm.name.trim(),
    phone: supportState.leadForm.phone.trim(),
    service: supportState.leadForm.service.trim(),
  };
  saveSupportState();
  renderSupportWidget();
  scrollSupportChatToBottom();

  appendSupportMessage(
    "bot",
    `Cảm ơn anh/chị ${supportState.leadData.name}. Em đã nhận thông tin và sẽ tiếp tục hỗ trợ ngay ạ.`
  );

  if (supportState.pendingInitialMessage) {
    const pendingMessage = supportState.pendingInitialMessage;
    supportState.pendingInitialMessage = "";
    saveSupportState();
    await requestBotReply(pendingMessage, {
      conversation: getLeadCaptureConversation(),
    });
  }
}

function bindSupportWidgetEvents() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-support-open-chatbot]")) {
      supportState.chatbotOpen = true;
      renderSupportWidget();
      scrollSupportChatToBottom();
      return;
    }

    if (event.target.closest("[data-support-close-chatbot]")) {
      supportState.chatbotOpen = false;
      renderSupportWidget();
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (!target.closest("#supportLeadForm")) return;

    supportState.leadForm = {
      ...supportState.leadForm,
      [target.name]: target.value,
    };
    if (supportState.leadErrors[target.name]) {
      supportState.leadErrors = {
        ...supportState.leadErrors,
        [target.name]: "",
      };
    }
    saveSupportState();
  });

  document.addEventListener("submit", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) return;

    const chatForm = target.closest("#supportChatForm");
    if (chatForm) {
      event.preventDefault();
      const input = document.getElementById("supportChatInput");
      if (!(input instanceof HTMLInputElement)) return;
      const value = input.value;
      input.value = "";
      submitSupportMessage(value);
      return;
    }

    const leadForm = target.closest("#supportLeadForm");
    if (leadForm) {
      event.preventDefault();
      submitLeadForm();
    }
  });
}

loadSupportState();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ensureSupportWidget();
    bindSupportWidgetEvents();
  });
} else {
  ensureSupportWidget();
  bindSupportWidgetEvents();
}
