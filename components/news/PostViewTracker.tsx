"use client";

import { useEffect } from "react";

type PostViewTrackerProps = {
  slug: string;
};

function storageKey(slug: string) {
  return `hpt:post-viewed:${slug}`;
}

export default function PostViewTracker({ slug }: PostViewTrackerProps) {
  useEffect(() => {
    if (!slug || typeof window === "undefined") return;
    if (window.sessionStorage.getItem(storageKey(slug))) return;

    let disposed = false;

    const trackView = async () => {
      try {
        const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
          method: "POST",
          cache: "no-store",
        });

        if (!response.ok || disposed) return;
        window.sessionStorage.setItem(storageKey(slug), "1");
      } catch {
        // Ignore transient errors and retry on a future session.
      }
    };

    void trackView();

    return () => {
      disposed = true;
    };
  }, [slug]);

  return null;
}
