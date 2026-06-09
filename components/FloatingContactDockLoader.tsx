"use client";

import dynamic from "next/dynamic";
import type { PublicSiteSettings } from "@/lib/content-payload";

const FloatingContactDock = dynamic(() => import("@/components/FloatingContactDock"), {
  ssr: false,
});

export default function FloatingContactDockLoader({ settings }: { settings: Required<PublicSiteSettings> }) {
  return <FloatingContactDock settings={settings} />;
}
