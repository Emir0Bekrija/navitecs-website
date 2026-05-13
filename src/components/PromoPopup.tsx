"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ArrowRight } from "lucide-react";
import { useConsent } from "@/hooks/useConsent";
import { trackEvent } from "@/lib/analytics";

type PopupConfig = {
  enabled: boolean;
  badge: string;
  category: string;
  title: string;
  description: string;
  buttonText: string;
  linkUrl: string;
  linkType: string;
  openInNewTab: boolean;
};

export default function PromoPopup() {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const consent = useConsent();
  const analyticsGranted = consent?.analytics === true;

  // trackPopupClick: popup_click — only fires if analytics consent is granted
  function trackPopupClick(linkUrl: string, linkTitle: string) {
    if (!analyticsGranted) return;
    // Custom DB analytics
    fetch("/api/track/popup-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkUrl, linkTitle }),
    }).catch(() => {});
    // GA4 event
    // trackEvent: popup_click
    trackEvent("popup_click", { link_url: linkUrl, link_title: linkTitle });
  }

  useEffect(() => {
    fetch("/api/popup")
      .then((r) => r.json())
      .then((data: PopupConfig & { enabled: boolean }) => {
        if (!data.enabled) return;
        setConfig(data);
        setTimeout(() => setVisible(true), 1200);
      })
      .catch(() => {});
  }, []);

  const isExternal = config?.linkType === "external";
  const href = config?.linkUrl || "#";

  return (
    <AnimatePresence>
      {visible && config && (
        <motion.div
          key="promo-popup"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-6 right-6 z-40 w-[340px] max-w-[calc(100vw-2rem)]
                     max-sm:bottom-4 max-sm:left-4 max-sm:right-4 max-sm:w-auto"
          role="dialog"
          aria-modal="false"
          aria-label="Promotional insight"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60 backdrop-blur-xl bg-black/55">

            {/* Animated liquid gradient background layer */}
            <div
              className="absolute inset-0 animate-liquid-gradient opacity-[0.12]"
              style={{
                backgroundImage: "linear-gradient(135deg, #00AEEF, #00FF9C, #00AEEF, #009cd6, #00FF9C)",
              }}
              aria-hidden="true"
            />

            {/* BIM technical grid overlay */}
            <div className="absolute inset-0 bim-grid-overlay opacity-60" aria-hidden="true" />

            {/* Content */}
            <div className="relative z-10 p-5">

              {/* Top row: badge + category + close */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black">
                  {config.badge}
                </span>
                {config.category && (
                  <span className="text-[11px] text-gray-400 font-medium truncate flex-1">
                    {config.category}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  className="ml-auto -mr-1 -mt-1 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Close popup"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Title */}
              <h3 className="text-[15px] font-semibold text-white leading-snug mb-3">
                {config.title}
              </h3>

              {/* Description inner box */}
              <div className="rounded-xl bg-black/40 border border-white/8 px-4 py-3 mb-4">
                <p className="text-[12.5px] text-gray-300 leading-relaxed">
                  {config.description}
                </p>
              </div>

              {/* CTA button */}
              {isExternal ? (
                <a
                  href={href}
                  target={config.openInNewTab ? "_blank" : undefined}
                  rel={config.openInNewTab ? "noopener noreferrer" : undefined}
                  onClick={() => trackPopupClick(href, config.title)}
                  className="group inline-flex items-center gap-2 w-full justify-center px-4 py-2.5
                             bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black text-sm font-semibold
                             rounded-xl hover:opacity-90 transition-opacity relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {config.buttonText}
                    <ExternalLink size={13} className="opacity-80" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ) : (
                <Link
                  href={href}
                  target={config.openInNewTab ? "_blank" : undefined}
                  onClick={() => trackPopupClick(href, config.title)}
                  className="group inline-flex items-center gap-2 w-full justify-center px-4 py-2.5
                             bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black text-sm font-semibold
                             rounded-xl hover:opacity-90 transition-opacity relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {config.buttonText}
                    <ArrowRight size={13} className="opacity-80" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )}
            </div>

            {/* Thin gradient accent line at top */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] opacity-70"
              aria-hidden="true"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
