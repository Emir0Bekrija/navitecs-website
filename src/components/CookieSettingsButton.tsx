"use client";

/**
 * Small client component that lives in the Footer.
 * Clicking it fires "openCookieSettings", which CookieConsent listens for.
 */
export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("openCookieSettings"))
      }
      className="inline-flex items-baseline p-0 m-0 bg-transparent border-0 
      appearance-none cursor-pointer text-inherit 
      hover:text-white transition-colors 
      [font:inherit] leading-[inherit]"
    >
      Cookie settings
    </button>
  );
}
