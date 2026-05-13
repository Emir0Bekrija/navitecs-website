/**
 * Cookie/consent storage utilities.
 * Consent is persisted in localStorage under CONSENT_KEY.
 * A custom DOM event ("navitecs:consent-updated") is dispatched whenever
 * consent is saved so React hooks can re-render without a shared store.
 */

export const CONSENT_KEY = "navitecs_consent";
export const CONSENT_VERSION = "1.0";

export type ConsentState = {
  necessary: true; // always true — cannot be disabled
  analytics: boolean;
  version: string;
  updatedAt: string; // ISO date
};

export const CONSENT_EVENT = "navitecs:consent-updated";

/** Read stored consent, or null if not yet set. */
export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    // Validate shape
    if (typeof parsed.analytics !== "boolean") return null;
    return {
      necessary: true,
      analytics: parsed.analytics,
      version: parsed.version ?? CONSENT_VERSION,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Persist consent and broadcast the update event. */
export function saveConsent(analytics: boolean): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  return state;
}

/** True if the user has already made a consent choice (any version). */
export function hasConsented(): boolean {
  return readConsent() !== null;
}
