"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "@/hooks/useConsent";
import { trackEvent } from "@/lib/analytics";

/**
 * Tracks page views.
 *
 * - If the user has NOT granted analytics consent: does nothing.
 * - If the user HAS granted analytics consent:
 *   1. POSTs to /api/track (custom DB page view count)
 *   2. Sends a GA4 page_view event via gtag
 *
 * Call this hook from every public page client component.
 * Do NOT call it from admin panel components.
 */
export function usePageView() {
  const pathname = usePathname();
  const consent = useConsent();
  const fired = useRef(false);

  const analyticsGranted = consent?.analytics === true;

  useEffect(() => {
    fired.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!analyticsGranted) return;
    if (fired.current) return;
    fired.current = true;

    const referrer = document.referrer || undefined;

    // Custom analytics: POST page view to DB
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
    }).catch(() => {});

    // GA4 page_view event
    trackEvent("page_view", {
      page_path: pathname,
      page_referrer: referrer,
    });
  }, [pathname, analyticsGranted]);
}
