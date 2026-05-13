/**
 * Google Analytics 4 + Google Consent Mode v2 helpers.
 *
 * Rules:
 * - GA script is NEVER loaded until the user explicitly grants analytics consent.
 * - Consent Mode v2 defaults are set to "denied" for all ad/analytics storage.
 * - Only analytics_storage is updated to "granted" (no ad-related grants).
 * - The measurement ID is read from NEXT_PUBLIC_GA_MEASUREMENT_ID — never hardcoded.
 *
 * Usage:
 *   initConsentDefaults()           — call once on app mount (before any gtag calls)
 *   applyConsent(analyticsGranted)  — call after user chooses consent
 *   trackEvent(name, params)        — send a custom GA4 event (no-op if not loaded)
 *
 * Where to add tracking:
 *   - page_view: usePageView hook fires automatically when analytics consent is granted
 *   - popup_click: PromoPopup.tsx onClick handler
 *   - job_application_submit: ApplyClient.tsx after successful form submission
 *   - contact_form_submit: ContactClient.tsx after successful form submission
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
let gaLoaded = false;

function ensureDataLayer() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function (...args: unknown[]) {
      window.dataLayer.push(args);
    };
}

/**
 * Set Consent Mode v2 defaults to denied.
 * Must be called as early as possible — before the GA script loads.
 */
export function initConsentDefaults() {
  if (typeof window === "undefined") return;
  ensureDataLayer();
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
}

/**
 * Apply the user's consent choice.
 * Loads GA if analytics is granted and the script isn't loaded yet.
 */
export function applyConsent(analyticsGranted: boolean) {
  if (typeof window === "undefined") return;
  ensureDataLayer();

  // Update Consent Mode v2 — only analytics_storage, never ad signals
  window.gtag("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    // ad_storage stays denied — we have no ads/marketing
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  if (analyticsGranted && !gaLoaded) {
    loadGAScript();
  }
}

/** Inject the GA4 gtag.js script tag. Safe to call multiple times. */
function loadGAScript() {
  if (!GA_ID || gaLoaded || typeof document === "undefined") return;
  gaLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  ensureDataLayer();
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    // Disable automatic page_view — we fire it manually via usePageView
    send_page_view: false,
  });
}

/**
 * Send a custom GA4 event.
 * No-op if GA is not loaded (user hasn't granted analytics consent).
 *
 * Examples:
 *   trackEvent("page_view", { page_path: "/careers" })
 *   trackEvent("popup_click", { link_url: "...", link_title: "..." })
 *   trackEvent("job_application_submit", { job_title: "..." })
 *   trackEvent("contact_form_submit")
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !gaLoaded || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}

/** Whether GA has been loaded in this session. */
export function isGALoaded() {
  return gaLoaded;
}
