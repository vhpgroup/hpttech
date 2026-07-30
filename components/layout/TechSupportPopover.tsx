"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Headset, Mail, PhoneCall } from "lucide-react";
import type { PublicSiteSettings } from "@/lib/content-payload";
import { formatPhoneDisplay, phoneHref, quoteMailHref } from "@/lib/site-settings";

// Cùng bộ icon 3D Fluent tự host trên media R2 với Header.
const R2_ICON = "/api/r2-media/";

/**
 * Nút "Hỗ trợ kỹ thuật" ở utility-topbar: bấm → popover thông tin kênh hỗ trợ
 * (hotline, email, Zalo, Messenger — cùng nguồn settings với FloatingContactDock)
 * kèm lối vào trang /lien-he. Khi JS chưa tải/tắt, nút vẫn là link /lien-he như cũ.
 */
export default function TechSupportPopover({ settings }: { settings: Required<PublicSiteSettings> }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const phone = settings.hotline || settings.phone;

  // Đóng popover khi bấm ra ngoài hoặc nhấn Esc.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`topbar-support${open ? " open" : ""}`} ref={rootRef}>
      <a
        className="topbar-support-btn"
        href="/lien-he"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="topbarSupportPop"
        onClick={(event) => {
          event.preventDefault();
          setOpen((prev) => !prev);
        }}
      >
        <Image src={`${R2_ICON}icon-topbar-ho-tro-kt.png`} alt="" aria-hidden="true" width={16} height={16} />
        Hỗ trợ kỹ thuật
      </a>

      {open ? (
        <div className="topbar-support-pop" id="topbarSupportPop" role="dialog" aria-label="Thông tin hỗ trợ kỹ thuật">
          <div className="topbar-support-head">
            <span className="topbar-support-head-icon">
              <Headset size={19} />
            </span>
            <div className="topbar-support-head-copy">
              <strong>Hỗ trợ kỹ thuật</strong>
              <small>Đội ngũ kỹ thuật HPT Tech sẵn sàng hỗ trợ quý khách</small>
            </div>
          </div>

          <div className="topbar-support-body">
            <a className="topbar-support-item" href={phoneHref(phone)}>
              <span className="topbar-support-icon phone">
                <PhoneCall size={16} />
              </span>
              <span className="topbar-support-copy">
                <strong>{formatPhoneDisplay(phone)}</strong>
                <small>Hotline 24/7 — bấm để gọi ngay</small>
              </span>
            </a>

            <a className="topbar-support-item" href={quoteMailHref(settings.email, "Yêu cầu hỗ trợ kỹ thuật HPT Tech")}>
              <span className="topbar-support-icon">
                <Mail size={16} />
              </span>
              <span className="topbar-support-copy">
                <strong>{settings.email}</strong>
                <small>Gửi yêu cầu qua email</small>
              </span>
            </a>

            <a className="topbar-support-item" href={settings.zalo} target="_blank" rel="noreferrer">
              <span className="topbar-support-icon">
                <Image src="/assets/icons/zalo.png" alt="Zalo" width={30} height={30} />
              </span>
              <span className="topbar-support-copy">
                <strong>Chat Zalo</strong>
                <small>8:30 - 17:30</small>
              </span>
            </a>

            <a className="topbar-support-item" href={settings.facebook} target="_blank" rel="noreferrer">
              <span className="topbar-support-icon">
                <Image src="/assets/icons/messenger.png" alt="Messenger" width={30} height={30} />
              </span>
              <span className="topbar-support-copy">
                <strong>Facebook Messenger</strong>
                <small>8:30 - 17:30</small>
              </span>
            </a>
          </div>

          <Link className="topbar-support-cta" href="/lien-he" onClick={() => setOpen(false)}>
            Gửi yêu cầu hỗ trợ
            <ChevronRight size={15} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
