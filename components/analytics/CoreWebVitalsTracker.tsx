"use client";

import { useEffect } from "react";

type Gtag = (
  command: "event",
  eventName: string,
  parameters: Record<string, string | number | boolean>,
) => void;

type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType?: string;
  };
};

type LayoutShiftEntry = PerformanceEntry & {
  hadRecentInput: boolean;
  value: number;
};

type EventTimingEntry = PerformanceEntry & {
  interactionId: number;
};

type PerformanceObserverOptionsWithThreshold = PerformanceObserverInit & {
  durationThreshold?: number;
};

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

function rounded(value: number) {
  return Math.round(value);
}

function sendVital(name: "CLS" | "INP" | "LCP", value: number) {
  if (typeof window.gtag !== "function" || !Number.isFinite(value)) return;

  const connection = (navigator as NavigatorWithConnection).connection;

  window.gtag("event", "web_vital", {
    event_category: "Core Web Vitals",
    event_label: name,
    web_vital_name: name,
    // GA4 accepts integer metric values. CLS is stored in thousandths to retain precision.
    value: name === "CLS" ? rounded(value * 1000) : rounded(value),
    web_vital_value: name === "CLS" ? rounded(value * 1000) : rounded(value),
    page_location: window.location.href,
    page_path: window.location.pathname,
    device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    connection_type: connection?.effectiveType || "unknown",
    non_interaction: true,
  });
}

/**
 * Thu thập Core Web Vitals từ phiên sử dụng thực tế và gửi vào GA4 đã được
 * cấu hình ở Site Settings. Component chỉ được render khi GA4 đang bật.
 */
export default function CoreWebVitalsTracker() {
  useEffect(() => {
    let lcp = 0;
    let cls = 0;
    const interactions = new Map<number, number>();
    let reported = false;

    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        lcp = Math.max(lcp, entry.startTime);
      }
    });

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
    });

    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as EventTimingEntry[]) {
        if (entry.interactionId) {
          interactions.set(
            entry.interactionId,
            Math.max(interactions.get(entry.interactionId) || 0, entry.duration),
          );
        }
      }
    });

    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    clsObserver.observe({ type: "layout-shift", buffered: true });
    inpObserver.observe({
      type: "event",
      buffered: true,
      durationThreshold: 16,
    } as PerformanceObserverOptionsWithThreshold);

    const report = () => {
      if (reported) return;
      reported = true;

      lcpObserver.disconnect();
      clsObserver.disconnect();
      inpObserver.disconnect();

      if (lcp > 0) sendVital("LCP", lcp);
      sendVital("CLS", cls);

      const inp = Math.max(0, ...interactions.values());
      if (inp > 0) sendVital("INP", inp);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") report();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", report, { once: true });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", report);
      report();
    };
  }, []);

  return null;
}