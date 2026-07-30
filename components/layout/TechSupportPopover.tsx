"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Headset } from "lucide-react";
import { technicalSupportItems } from "@/lib/support-contacts";
import { phoneHref } from "@/lib/site-settings";

// Cùng bộ icon 3D Fluent tự host trên media R2 với Header.
const R2_ICON = "/api/r2-media/";

/**
 * Nút "Hỗ trợ kỹ thuật" ở utility-topbar: bấm → popover danh sách kỹ thuật viên
 * (ảnh + tên + hotline bấm gọi trực tiếp — cùng nguồn technicalSupportItems với
 * sidebar trang chi tiết sản phẩm) kèm lối vào trang /lien-he.
 * Khi JS chưa tải/tắt, nút vẫn là link /lien-he như cũ.
 */
export default function TechSupportPopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
              <small>Gọi trực tiếp đội kỹ thuật HPT Tech</small>
            </div>
          </div>

          <div className="topbar-support-body">
            {technicalSupportItems.map((contact) => (
              <a
                key={`${contact.name}-${contact.phone}`}
                className="topbar-support-item"
                href={phoneHref(contact.phone)}
              >
                <span className="topbar-support-avatar" aria-hidden="true">
                  {contact.initials}
                  {contact.imageSrc ? (
                    <span
                      className="topbar-support-avatar-img"
                      style={{ backgroundImage: `url(${contact.imageSrc})` }}
                    />
                  ) : null}
                </span>
                <span className="topbar-support-copy">
                  <strong>{contact.name}</strong>
                  <small>
                    Hotline: <b>{contact.phone}</b>
                  </small>
                </span>
              </a>
            ))}
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
