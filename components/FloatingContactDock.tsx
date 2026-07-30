"use client";

import { Bot, Headset, Menu, Phone, SendHorizontal, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import { getProducts } from "@/lib/catalog";
import type { PublicSiteSettings } from "@/lib/content-payload";

type ChatMessage = {
  role: "bot" | "user";
  text: string;
};

type LeadForm = {
  name: string;
  phone: string;
  service: string;
};

const SUPPORT_INTRO_MESSAGE =
  "Em đang online ạ. Anh/chị vui lòng để lại nội dung cần hỗ trợ, em sẽ phản hồi ngay.";
const SUPPORT_LEAD_PROMPT = "Cho em xin thông tin anh/chị để tiện hỗ trợ.";

const defaultLeadForm = (): LeadForm => ({
  name: "",
  phone: "",
  service: "",
});

function formatHotline(hotline: string) {
  const digits = hotline.replace(/\D/g, "");
  return /^\d{10}$/.test(digits) ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : hotline;
}

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

function getFriendlyChatError(message: unknown, hotline: string) {
  const fallbackMessage = `Hệ thống chat đang tạm thời gián đoạn. Quý khách vui lòng liên hệ hotline ${hotline} hoặc Zalo/Facebook để được hỗ trợ ngay.`;
  const text = String(message || "").toLowerCase();
  if (!text) return fallbackMessage;

  return ["openai_api_key", "api key", "openai", "server", "network", "fetch"].some((marker) =>
    text.includes(marker)
  )
    ? fallbackMessage
    : String(message);
}

export function FloatingContactDock({ settings }: { settings: Required<PublicSiteSettings> }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
      if (!response.ok) throw new Error(getFriendlyChatError(payload.error, settings.hotline));
      if (!payload.reply) throw new Error("Hiện chưa nhận được phản hồi từ hệ thống chat.");
      appendMessage({ role: "bot", text: payload.reply });
    } catch (error) {
      appendMessage({ role: "bot", text: getFriendlyChatError(error instanceof Error ? error.message : error, settings.hotline) });
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

  const hotlineDigits = settings.hotline.replace(/\D/g, "");

  const openChatbot = () => {
    setMenuOpen(false);
    setChatbotOpen(true);
  };

  return (
    <div id="supportWidgetShell">
      <div className="support-widget">
        <div className={`support-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
          <button className="support-menu-item" type="button" onClick={openChatbot} tabIndex={menuOpen ? 0 : -1}>
            <span className="support-menu-icon ai">
              <Bot size={20} />
            </span>
            <span className="support-menu-copy">
              <strong>Chat với AI HPT</strong>
              <small>Phản hồi ngay 24/7</small>
            </span>
          </button>

          <a
            className="support-menu-item"
            href={settings.zalo}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="support-menu-icon">
              <Image src="/assets/icons/zalo.png" alt="Zalo" width={38} height={38} />
            </span>
            <span className="support-menu-copy">
              <strong>Tư vấn qua Zalo</strong>
              <small>8:30 - 17:30</small>
            </span>
          </a>

          <a
            className="support-menu-item"
            href={settings.facebook}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="support-menu-icon">
              <Image src="/assets/icons/messenger.png" alt="Messenger" width={38} height={38} />
            </span>
            <span className="support-menu-copy">
              <strong>Facebook Messenger</strong>
              <small>8:30 - 17:30</small>
            </span>
          </a>

          <a className="support-menu-item" href={`tel:${hotlineDigits}`} onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
            <span className="support-menu-icon phone">
              <Phone size={19} />
            </span>
            <span className="support-menu-copy">
              <strong>Gọi {formatHotline(settings.hotline)}</strong>
              <small>Hotline hỗ trợ</small>
            </span>
          </a>
        </div>

        <button
          type="button"
          className={`support-launcher ${menuOpen ? "open" : ""}`}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Đóng menu tư vấn" : "Mở menu tư vấn"}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X size={19} /> : <Headset size={19} />}
          <span>Tư vấn HPT</span>
        </button>
      </div>

      <div className={`support-chatbot ${chatbotOpen ? "open" : ""}`}>
        <div className="support-chatbot-head">
          <button type="button" className="support-chatbot-menu" aria-label="Mở menu">
            <Menu size={18} />
          </button>
          <div className="support-chatbot-brand">
            <div className="support-chatbot-logo">
              <Image src="/assets/logo/hptlogo.png" alt="HPT Tech" width={48} height={32} />
            </div>
            <div>
              <strong>{settings.companyName}</strong>
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
                    <Image src="/assets/logo/hptlogo.png" alt={settings.companyName} width={28} height={28} />
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
                  <Image src="/assets/logo/hptlogo.png" alt="HPT Tech" width={28} height={28} />
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
