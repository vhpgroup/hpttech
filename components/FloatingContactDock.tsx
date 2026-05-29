"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type FloatingContactDockProps = {
  zaloHref?: string;
  messengerHref?: string;
  aiHref?: string;
  className?: string;
  zaloLogoSrc?: string;
  messengerLogoSrc?: string;
  aiLogoSrc?: string;
};

type DockItem = {
  id: "zalo" | "messenger" | "ai";
  label: string;
  href: string;
  glowClass: string;
  surfaceClass: string;
  icon: React.ReactNode;
  prominent?: boolean;
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function BrandIcon({
  src,
  alt,
  size = 28,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <Image src={src} alt={alt} width={size} height={size} className="h-7 w-7 object-contain" />
  );
}

function DockButton({
  item,
  isActive,
  onHoverChange,
}: {
  item: DockItem;
  isActive: boolean;
  onHoverChange: (active: boolean) => void;
}) {
  const isExternal = /^https?:\/\//.test(item.href);

  return (
    <motion.div
      initial={false}
      animate={{ scale: isActive ? 1.035 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className="relative"
      onHoverStart={() => onHoverChange(true)}
      onHoverEnd={() => onHoverChange(false)}
      onFocusCapture={() => onHoverChange(true)}
      onBlurCapture={() => onHoverChange(false)}
    >
      <AnimatePresence>
        {isActive ? (
          <motion.div
            key={`${item.id}-tooltip`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2"
          >
            <div className="rounded-full border border-white/15 bg-slate-950/88 px-3 py-1.5 text-xs font-medium text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl dark:bg-white/92 dark:text-slate-900">
              {item.label}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Link
        href={item.href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        aria-label={item.label}
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/50 text-slate-900 shadow-[0_14px_40px_rgba(15,23,42,0.14)] backdrop-blur-2xl transition-all duration-300",
          "dark:border-white/10 dark:text-white dark:shadow-[0_18px_40px_rgba(2,6,23,0.45)]",
          item.surfaceClass,
          item.prominent && "h-16 w-16 rounded-[1.35rem]"
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100",
            item.glowClass
          )}
        />
        {item.prominent ? (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-[inherit] border border-cyan-300/25"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        ) : null}
        <span className="relative z-10">{item.icon}</span>
      </Link>
    </motion.div>
  );
}

export function FloatingContactDock({
  zaloHref = "https://zalo.me/0876645432",
  messengerHref = "https://m.me/your-page-id",
  aiHref = "/chat",
  className,
  zaloLogoSrc = "/icons/zalo-official.svg",
  messengerLogoSrc = "/icons/messenger-official.svg",
  aiLogoSrc = "/icons/hpt-ai-official.svg",
}: FloatingContactDockProps) {
  const [activeId, setActiveId] = useState<DockItem["id"] | null>(null);

  const items: DockItem[] = [
    {
      id: "zalo",
      label: "Chat Zalo",
      href: zaloHref,
      glowClass: "bg-[radial-gradient(circle_at_center,rgba(0,106,255,0.28),transparent_70%)]",
      surfaceClass:
        "bg-white/88 hover:border-[#0068FF]/25 hover:bg-white dark:bg-slate-900/88 dark:hover:border-[#4EA1FF]/30",
      icon: <BrandIcon src={zaloLogoSrc} alt="Zalo official logo" />,
    },
    {
      id: "messenger",
      label: "Messenger",
      href: messengerHref,
      glowClass: "bg-[radial-gradient(circle_at_center,rgba(122,97,255,0.3),transparent_70%)]",
      surfaceClass:
        "bg-white/88 hover:border-fuchsia-400/20 hover:bg-white dark:bg-slate-900/88 dark:hover:border-fuchsia-300/20",
      icon: <BrandIcon src={messengerLogoSrc} alt="Messenger official logo" />,
    },
    {
      id: "ai",
      label: "AI Hỗ trợ",
      href: aiHref,
      glowClass: "bg-[radial-gradient(circle_at_center,rgba(45,91,255,0.34),transparent_72%)]",
      surfaceClass:
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(237,244,255,0.92))] hover:border-[#4D63FF]/30 dark:bg-[linear-gradient(180deg,rgba(22,36,71,0.94),rgba(13,24,49,0.96))] dark:hover:border-cyan-300/20",
      icon: <BrandIcon src={aiLogoSrc} alt="HPT AI official logo" />,
      prominent: true,
    },
  ];

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 top-1/2 z-50 -translate-y-1/2 sm:right-5",
        "max-sm:top-auto max-sm:bottom-5 max-sm:translate-y-0",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className={cn(
          "pointer-events-auto flex flex-col items-center gap-3 rounded-[2rem] border border-white/45 bg-white/26 px-2.5 py-3 shadow-[0_16px_50px_rgba(15,23,42,0.14)] backdrop-blur-2xl",
          "dark:border-white/10 dark:bg-slate-950/28 dark:shadow-[0_18px_60px_rgba(2,6,23,0.5)]",
          "sm:gap-3.5 sm:px-3 sm:py-3.5",
          "max-sm:flex-row max-sm:rounded-full max-sm:px-3 max-sm:py-2.5"
        )}
      >
        {items.map((item) => (
          <DockButton
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onHoverChange={(active) => setActiveId(active ? item.id : null)}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default FloatingContactDock;
