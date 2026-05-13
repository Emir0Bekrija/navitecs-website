"use client";

import { useEffect, useState } from "react";
import { readConsent, CONSENT_EVENT, type ConsentState } from "@/lib/consent";

/**
 * Returns the current consent state and re-renders whenever it changes.
 * Safe to call from any client component.
 */
export function useConsent(): ConsentState | null {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    // Read initial value from localStorage
    setConsent(readConsent());

    function onUpdate(e: Event) {
      setConsent((e as CustomEvent<ConsentState>).detail);
    }
    window.addEventListener(CONSENT_EVENT, onUpdate);
    return () => window.removeEventListener(CONSENT_EVENT, onUpdate);
  }, []);

  return consent;
}
