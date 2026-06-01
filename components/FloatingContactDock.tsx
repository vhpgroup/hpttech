"use client";

import { Bot, Menu, SendHorizontal, X } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { getProducts } from "@/lib/catalog";

type ChatMessage = {
  role: "bot" | "user";
  text: string;
};

type LeadForm = {
  name: string;
  phone: string;
  service: string;
};

const SUPPORT_FALLBACK_MESSAGE =
  "Hệ thống chat đang tạm thời gián đoạn. Quý khách vui lòng liên hệ hotline 0876 645 432 hoặc Zalo/Facebook để được hỗ trợ ngay.";
const SUPPORT_INTRO_MESSAGE =
  "Em đang online ạ. Anh/chị vui lòng để lại nội dung cần hỗ trợ, em sẽ phản hồi ngay.";
const SUPPORT_LEAD_PROMPT = "Cho em xin thông tin anh/chị để tiện hỗ trợ.";

const defaultLeadForm = (): LeadForm => ({
  name: "",
  phone: "",
  service: "",
});

function getRelevantProducts(message: string) {
  const keywords = message
    .toLowerCase()
    .split(/[\s,.;:!?()]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);

  if (!keywords.length) return [];

  return getProducts()
    .map((product) => {
      const haystack = [product.title, product.detail, product.brand, product.category].join(" ").toLowerCase();
      const score = keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0);
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.product);
}

function getFriendlyChatError(message: unknown) {
  const text = String(message || "").toLowerCase();
  if (!text) return SUPPORT_FALLBACK_MESSAGE;

  return ["openai_api_key", "api key", "openai", "server", "network", "fetch"].some((marker) =>
    text.includes(marker)
  )
    ? SUPPORT_FALLBACK_MESSAGE
    : String(message);
}

export function FloatingContactDock() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [pendingInitialMessage, setPendingInitialMessage] = useState("");
  const [leadForm, setLeadForm] = useState<LeadForm>(defaultLeadForm);
  const [leadErrors, setLeadErrors] = useState<Partial<Record<keyof LeadForm, string>>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "bot", text: SUPPORT_INTRO_MESSAGE }]);
  const inputRef = useRef<HTMLInputElement>(null);

  const recentConversation = useMemo(
    () =>
      messages.slice(-8).map((message) => ({
        role: message.role === "bot" ? "assistant" : "user",
        content: message.text,
      })),
    [messages]
  );

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const requestBotReply = async (message: string, conversation = recentConversation) => {
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversation,
          relevantProducts: getRelevantProducts(message),
          page: window.location.pathname,
          customerInfo: leadForm,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getFriendlyChatError(payload.error));
      if (!payload.reply) throw new Error("Hiện chưa nhận được phản hồi từ hệ thống chat.");
      appendMessage({ role: "bot", text: payload.reply });
    } catch (error) {
      appendMessage({ role: "bot", text: getFriendlyChatError(error instanceof Error ? error.message : error) });
    } finally {
      setLoading(false);
    }
  };

  const submitSupportMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = inputRef.current;
    const message = input?.value.trim() || "";
    if (!message || loading || leadFormOpen) return;

    if (input) input.value = "";
    appendMessage({ role: "user", text: message });

    if (!leadCaptured && messages.filter((item) => item.role === "user").length === 0) {
      setPendingInitialMessage(message);
      setLeadFormOpen(true);
      setLeadErrors({});
      setLeadForm({ ...defaultLeadForm(), service: "Tư vấn giải pháp" });
      appendMessage({ role: "bot", text: SUPPORT_LEAD_PROMPT });
      return;
    }

    await requestBotReply(message);
  };

  const submitLeadForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Partial<Record<keyof LeadForm, string>> = {};
    const phone = leadForm.phone.trim();

    if (!leadForm.name.trim()) errors.name = "Tên chưa được nhập.";
    if (!phone) errors.phone = "Số điện thoại chưa được nhập.";
    else if (!/^(0|\+84)[0-9]{8,10}$/.test(phone.replace(/\s+/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ.";
    }

    setLeadErrors(errors);
    if (Object.keys(errors).length) return;

    setLeadCaptured(true);
    setLeadFormOpen(false);
    appendMessage({
      role: "bot",
      text: `Cảm ơn anh/chị ${leadForm.name.trim()}. Em đã nhận thông tin và sẽ tiếp tục hỗ trợ ngay ạ.`,
    });

    if (pendingInitialMessage) {
      const pending = pendingInitialMessage;
      setPendingInitialMessage("");
      await requestBotReply(pending, [{ role: "assistant", content: SUPPORT_INTRO_MESSAGE }]);
    }
  };

  return (
    <div id="supportWidgetShell">
      <div className="support-widget">
        <div className="support-stack open">
          <a className="support-card zalo" href="https://zalo.me/0876645432" target="_blank" rel="noreferrer">
            <span className="support-card-icon zalo">
              <img className="support-card-icon-zalo-image" src="/assets/icons/zalo.png" alt="Zalo" />
            </span>
            <span className="support-card-copy">
              <strong>Tư vấn Zalo</strong>
              <small>(8:30 - 21:00)</small>
            </span>
          </a>

          <a className="support-card facebook" href="https://www.facebook.com/solarangelx9/" target="_blank" rel="noreferrer">
            <span className="support-card-icon facebook">
              <img className="support-card-icon-messenger-image" src="/assets/icons/messenger.png" alt="Messenger" />
            </span>
            <span className="support-card-copy">
              <strong>Chat Facebook</strong>
              <small>(8:30 - 21:00)</small>
            </span>
          </a>

          <button className="support-card chatbot" type="button" onClick={() => setChatbotOpen(true)}>
            <img
              className="support-card-chatbot-banner"
              src="/assets/icons/bot.png"
              alt="Hỗ trợ Online"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                const fallback = event.currentTarget.nextElementSibling;
                if (fallback instanceof HTMLElement) fallback.style.display = "flex";
              }}
            />
            <span className="support-card-chatbot-fallback" style={{ display: "none" }}>
              <Bot />
              <strong>Hỗ trợ Online</strong>
            </span>
          </button>
        </div>
      </div>

      <div className={`support-chatbot ${chatbotOpen ? "open" : ""}`}>
        <div className="support-chatbot-head">
          <button type="button" className="support-chatbot-menu" aria-label="Mở menu">
            <Menu size={18} />
          </button>
          <div className="support-chatbot-brand">
            <div className="support-chatbot-logo">
              <img src="https://hpttech.vn/media/32/content/HPT-Logo.png" alt="HPT Tech" />
            </div>
            <div>
              <strong>HPT Tech</strong>
              <small>Agent online</small>
            </div>
          </div>
          <button type="button" className="support-chatbot-close" aria-label="Đóng chatbot" onClick={() => setChatbotOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="support-chatbot-body">
          <div className="support-chatbot-messages" id="supportChatMessages">
            {messages.map((message, index) => (
              <div className={`support-chat-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.role === "bot" ? (
                  <div className="support-chat-avatar" aria-hidden="true">
                    <img src="https://hpttech.vn/media/32/content/HPT-Logo.png" alt="HPT Tech" />
                  </div>
                ) : null}
                <div className="support-chat-content">
                  <div className="support-chat-bubble">{message.text}</div>
                </div>
              </div>
            ))}
            {loading ? (
              <div className="support-chat-message bot loading">
                <div className="support-chat-avatar" aria-hidden="true">
                  <img src="https://hpttech.vn/media/32/content/HPT-Logo.png" alt="HPT Tech" />
                </div>
                <div className="support-chat-content">
                  <div className="support-chat-bubble support-chat-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {leadFormOpen ? (
            <form className="support-lead-form" onSubmit={submitLeadForm}>
              <h3>Thông tin cơ bản</h3>
              <label className="support-lead-field">
                <input
                  name="name"
                  type="text"
                  placeholder="Nhập tên của bạn *"
                  value={leadForm.name}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                {leadErrors.name ? <small>{leadErrors.name}</small> : null}
              </label>
              <label className="support-lead-field">
                <input
                  name="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại của bạn *"
                  value={leadForm.phone}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
                {leadErrors.phone ? <small>{leadErrors.phone}</small> : null}
              </label>
              <label className="support-lead-field">
                <select
                  name="service"
                  value={leadForm.service}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, service: event.target.value }))}
                >
                  <option value="">--- Chọn 1 dịch vụ hỗ trợ ---</option>
                  <option value="Báo giá sản phẩm">Báo giá sản phẩm</option>
                  <option value="Tư vấn giải pháp">Tư vấn giải pháp</option>
                  <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
                  <option value="Khác">Khác</option>
                </select>
              </label>
              <button type="submit" className="support-lead-submit">
                Bắt đầu trò chuyện
              </button>
            </form>
          ) : null}

          <form className="support-chatbot-form" onSubmit={submitSupportMessage}>
            <input
              ref={inputRef}
              type="text"
              placeholder={leadFormOpen ? "Vui lòng hoàn tất thông tin trước..." : "Nhập nội dung cần hỗ trợ..."}
              disabled={loading || leadFormOpen}
            />
            <button type="submit" aria-label="Gửi tin nhắn" disabled={loading || leadFormOpen}>
              <SendHorizontal size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FloatingContactDock;
