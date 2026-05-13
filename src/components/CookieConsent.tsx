"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Settings, X, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  readConsent,
  saveConsent,
  hasConsented,
  CONSENT_EVENT,
} from "@/lib/consent";
import { initConsentDefaults, applyConsent } from "@/lib/analytics";

type View = "banner" | "preferences";

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("banner");
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  // Tracks which category descriptions are expanded
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  // On mount: set consent mode defaults, show banner if user hasn't chosen yet
  useEffect(() => {
    initConsentDefaults();

    const stored = readConsent();
    if (stored) {
      // Already chose — apply stored consent silently
      applyConsent(stored.analytics);
      setAnalyticsEnabled(stored.analytics);
    } else {
      // First visit — show banner
      setOpen(true);
    }

    // Listen for "reopen preferences" event fired by the footer button
    function onOpen() {
      const current = readConsent();
      setAnalyticsEnabled(current?.analytics ?? false);
      setView("preferences");
      setOpen(true);
    }
    window.addEventListener("openCookieSettings", onOpen);
    return () => window.removeEventListener("openCookieSettings", onOpen);
  }, []);

  // Also listen for consent-updated events (e.g. from another tab — future-proof)
  useEffect(() => {
    function onConsent() {
      const s = readConsent();
      if (s) setAnalyticsEnabled(s.analytics);
    }
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  function acceptAll() {
    saveConsent(true);
    applyConsent(true);
    setOpen(false);
  }

  function rejectNonEssential() {
    saveConsent(false);
    applyConsent(false);
    setOpen(false);
  }

  function savePreferences() {
    saveConsent(analyticsEnabled);
    applyConsent(analyticsEnabled);
    setOpen(false);
  }

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop (preferences view only) */}
          {view === "preferences" && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                // Close without saving if preferences already exist
                if (hasConsented()) setOpen(false);
              }}
            />
          )}

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={
              view === "banner"
                ? // Banner: fixed bottom bar
                  "fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl"
                : // Preferences: centered modal
                  "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            }
            role="dialog"
            aria-modal="true"
            aria-label="Cookie consent"
          >
            {/* Gradient accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00AEEF] to-[#00FF9C]"
              aria-hidden="true"
            />

            {view === "banner" ? (
              <BannerContent
                onAcceptAll={acceptAll}
                onRejectNonEssential={rejectNonEssential}
                onManagePreferences={() => setView("preferences")}
              />
            ) : (
              <PreferencesContent
                analyticsEnabled={analyticsEnabled}
                onToggleAnalytics={setAnalyticsEnabled}
                expandedCategories={expandedCategories}
                onToggleCategory={toggleCategory}
                onSave={savePreferences}
                onAcceptAll={acceptAll}
                onClose={hasConsented() ? () => setOpen(false) : undefined}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────────────────────
   Banner content
────────────────────────────────────────────────────────────── */
function BannerContent({
  onAcceptAll,
  onRejectNonEssential,
  onManagePreferences,
}: {
  onAcceptAll: () => void;
  onRejectNonEssential: () => void;
  onManagePreferences: () => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center gap-4">
      <Cookie
        size={20}
        className="shrink-0 text-[#00AEEF] hidden md:block"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300 leading-relaxed">
          We use cookies to keep the site secure and functional. With your
          permission, we also collect analytics to improve our services.{" "}
          <button
            type="button"
            onClick={onManagePreferences}
            className="underline underline-offset-2 text-white hover:text-[#00AEEF] transition-colors"
          >
            Manage preferences
          </button>{" "}
          or read our{" "}
          <a
            href="/privacy-policy"
            className="underline underline-offset-2 text-white hover:text-[#00AEEF] transition-colors"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onRejectNonEssential}
          className="border-white/20 text-gray-600 font-bold hover:text-white hover:bg-white/10 text-xs h-8"
        >
          Reject non-essential
        </Button>
        <Button
          size="sm"
          onClick={onAcceptAll}
          className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold hover:opacity-90 text-xs h-8"
        >
          Accept all
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Preferences modal content
────────────────────────────────────────────────────────────── */
function PreferencesContent({
  analyticsEnabled,
  onToggleAnalytics,
  expandedCategories,
  onToggleCategory,
  onSave,
  onAcceptAll,
  onClose,
}: {
  analyticsEnabled: boolean;
  onToggleAnalytics: (v: boolean) => void;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (key: string) => void;
  onSave: () => void;
  onAcceptAll: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-[#00AEEF]" aria-hidden="true" />
          <h2 className="text-base font-semibold text-white">
            Cookie preferences
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close preferences"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-5 leading-relaxed">
        We respect your privacy. Choose which cookies you allow below. Necessary
        cookies keep the site working and cannot be disabled. See our{" "}
        <a
          href="/privacy-policy"
          className="underline underline-offset-2 hover:text-white transition-colors"
        >
          Privacy Policy
        </a>{" "}
        for details.
      </p>

      {/* Categories */}
      <div className="space-y-3 mb-6">
        {/* Necessary */}
        <CategoryRow
          title="Necessary"
          description="Essential for security, form submissions, job applications, contact requests, and basic site operation. These cookies cannot be disabled."
          isExpanded={expandedCategories["necessary"] ?? false}
          onToggleExpand={() => onToggleCategory("necessary")}
          enabled={true}
          alwaysOn
        />

        {/* Analytics */}
        <CategoryRow
          title="Analytics"
          description="Helps us understand how visitors use the site — page views, time spent, geographic region, and interaction with on-page elements. We use custom analytics and Google Analytics 4. No advertising or profiling."
          isExpanded={expandedCategories["analytics"] ?? false}
          onToggleExpand={() => onToggleCategory("analytics")}
          enabled={analyticsEnabled}
          onToggle={onToggleAnalytics}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={onSave}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm"
          variant="outline"
        >
          Save preferences
        </Button>
        <Button
          onClick={onAcceptAll}
          className="flex-1 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold hover:opacity-90 text-sm"
        >
          Accept all
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Reusable category row
────────────────────────────────────────────────────────────── */
function CategoryRow({
  title,
  description,
  isExpanded,
  onToggleExpand,
  enabled,
  onToggle,
  alwaysOn,
}: {
  title: string;
  description: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  enabled: boolean;
  onToggle?: (v: boolean) => void;
  alwaysOn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-2 text-left"
          aria-expanded={isExpanded}
        >
          <span className="text-sm font-medium text-white">{title}</span>
          {isExpanded ? (
            <ChevronUp size={14} className="text-gray-500 shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-gray-500 shrink-0" />
          )}
        </button>
        {alwaysOn ? (
          <span className="text-[11px] text-gray-500 font-medium">
            Always on
          </span>
        ) : (
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            aria-label={`Toggle ${title} cookies`}
            className="data-[state=checked]:bg-[#00AEEF]"
          />
        )}
      </div>
      {isExpanded && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}
