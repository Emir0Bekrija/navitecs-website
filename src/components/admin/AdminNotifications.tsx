"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  FileText,
  MessageSquare,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifType = "application" | "contact";

type NotifItem = {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  href: string;
  time: Date;
  read: boolean;
};

type AppEventData = {
  firstName: string;
  lastName: string;
  applicantId: string;
};
type ContactEventData = { name: string; id: number };

// ── Sound ─────────────────────────────────────────────────────────────────────

function playSound(type: NotifType) {
  try {
    const src = type === "application" ? "/application.mp3" : "/contact.mp3";
    new Audio(src).play();
  } catch {
    console.warn("Failed to play notification sound");
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return date.toLocaleDateString();
}

const MAX_NOTIFS = 50;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminNotifications() {
  const router = useRouter();
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Stable ref so SSE listener always calls the latest version without re-subscribing
  const addNotifRef = useRef<
    (type: NotifType, data: AppEventData | ContactEventData) => void
  >(() => {});

  const addNotif = useCallback(
    (type: NotifType, data: AppEventData | ContactEventData) => {
      const isApp = type === "application";
      const displayName = isApp
        ? `${(data as AppEventData).firstName} ${(data as AppEventData).lastName}`.trim()
        : (data as ContactEventData).name;
      const href = isApp
        ? "/navitecs-control-admin/applicants"
        : "/navitecs-control-admin/contacts";

      const item: NotifItem = {
        id: Date.now(),
        type,
        title: isApp ? "New Application" : "New Contact",
        body: `${displayName} submitted ${isApp ? "a job application" : "a contact inquiry"}.`,
        href,
        time: new Date(),
        read: false,
      };

      setNotifs((prev) => [item, ...prev].slice(0, MAX_NOTIFS));
      playSound(type);

      if (Notification.permission === "granted") {
        new Notification(`${item.title} — NAVITECS`, {
          body: item.body,
          icon: "/favicon.ico",
          tag: type,
        });
      }
    },
    [],
  );

  // Keep ref always pointing to the latest addNotif
  addNotifRef.current = addNotif;

  // ── Init: read permission ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // ── SSE stream ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (permission !== "granted") return;

    const es = new EventSource("/api/admin/stream");

    es.addEventListener("new_application", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as AppEventData;
      addNotifRef.current("application", data);
    });
    es.addEventListener("new_contact", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as ContactEventData;
      addNotifRef.current("contact", data);
    });

    return () => es.close();
  }, [permission]);

  // ── Close panel on outside click ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        panelRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const unread = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: number) {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function togglePanel() {
    setOpen((v) => !v);
  }

  function handleNotifClick(n: NotifItem) {
    markRead(n.id);
    setOpen(false);
    router.push(n.href);
  }

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  if (permission === "unsupported") return null;

  if (permission === "denied") {
    return (
      <span
        title="Notifications blocked — enable them in browser site settings"
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-red-400 cursor-default"
      >
        <BellOff size={14} />
        Blocked
      </span>
    );
  }

  if (permission === "default") {
    return (
      <button
        onClick={requestPermission}
        title="Enable browser notifications for new applications and contacts"
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <Bell size={14} />
        Enable Alerts
      </button>
    );
  }

  // permission === "granted"
  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={togglePanel}
        className={`relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all ${
          open
            ? "text-white bg-white/10"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
        title="Notifications"
      >
        <Bell size={14} className={unread > 0 ? "text-[#00FF9C]" : ""} />
        <span className={unread > 0 ? "text-[#00FF9C]" : ""}>
          {unread > 0 ? `${unread} new` : "Live"}
        </span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00AEEF] text-[9px] font-bold text-black">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">
              Notifications
            </span>
            {notifs.length > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#00FF9C] transition-colors"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <Bell size={28} className="mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifs.map((n) => {
                const Icon =
                  n.type === "application" ? FileText : MessageSquare;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${
                      n.read
                        ? "opacity-50"
                        : "bg-[#00AEEF]/5 border-l-2 border-l-[#00AEEF]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 shrink-0 ${n.read ? "text-gray-600" : "text-[#00AEEF]"}`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
                      <p className="text-[11px] text-gray-600 mt-1">
                        {timeAgo(n.time)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#00AEEF]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
