"use client";

import { useEffect, useState } from "react";

type AdminEvent = "new_application" | "new_contact";

/**
 * Connects to /api/admin/stream (SSE) and calls `onEvent` when the
 * specified event fires. Returns `connected` state for optional UI.
 *
 * Automatically reconnects after 5 s if the connection drops.
 */
export function useAdminStream(
  event: AdminEvent,
  onEvent: () => void
): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let es: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/admin/stream");

      es.addEventListener("connected", () => setConnected(true));
      es.addEventListener("heartbeat", () => {});
      es.addEventListener(event, () => onEvent());

      es.onerror = () => {
        setConnected(false);
        es.close();
        retryTimer = setTimeout(connect, 5_000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      es?.close();
    };
    // onEvent is intentionally excluded — callers should wrap it in useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return connected;
}
