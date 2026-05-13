"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "@/hooks/useConsent";
import { trackEvent } from "@/lib/analytics";

/**
 * Tracks page views and time-on-page.
 *
 * Behaviour:
 * - If the user has NOT granted analytics consent: does nothing.
 * - If the user HAS granted analytics consent:
 *   1. POSTs to /api/track (custom DB analytics — page_view, IP, country)
 *   2. Sends a GA4 page_view event via gtag
 *   3. PATCHes /api/track/duration on page leave
 *
 * Call this hook from every public page client component.
 * Do NOT call it from admin panel components.
 */
export function usePageView() {
  const pathname = usePathname();
  const consent = useConsent();
  const fired = useRef(false);
  const pageViewId = useRef<number | null>(null);
  const startTime = useRef<number>(Date.now());

  const analyticsGranted = consent?.analytics === true;

  useEffect(() => {
    // Re-run whenever pathname changes or analytics consent is granted
    fired.current = false;
    pageViewId.current = null;
    startTime.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    // Only track if analytics consent has been given
    if (!analyticsGranted) return;
    if (fired.current) return;
    fired.current = true;
    startTime.current = Date.now();

    const referrer = document.referrer || undefined;

    // Custom analytics: POST page view to DB (includes IP + country on server side)
    (async () => {
      try {
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: pathname, referrer }),
        });
        if (res.ok) {
          const data: { id: number } | null = await res.json();
          if (data?.id) pageViewId.current = data.id;
        }
      } catch {
        // tracking must never break the page
      }
    })();

    // GA4 page_view event
    trackEvent("page_view", {
      page_path: pathname,
      page_referrer: referrer,
    });
  }, [pathname, analyticsGranted]);

  // Send duration on page leave
  useEffect(() => {
    if (!analyticsGranted) return;

    function sendDuration() {
      const id = pageViewId.current;
      if (!id) return;
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration < 1) return;
      const payload = JSON.stringify({ id, duration });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track/duration",
          new Blob([payload], { type: "application/json" })
        );
      } else {
        fetch("/api/track/duration", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") sendDuration();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", sendDuration);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", sendDuration);
    };
  }, [analyticsGranted]);
}
