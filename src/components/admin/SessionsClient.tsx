"use client";

import { useCallback, useEffect, useState } from "react";
import { MonitorDot, RefreshCw, Trash2, Shield, Globe } from "lucide-react";

type Session = {
  id: string;
  userId: number;
  username: string;
  role: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

function parseBrowser(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}

function parseOS(ua: string | null): string {
  if (!ua) return "";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "";
}

export default function SessionsClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sessions");
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function revokeSession(id: string) {
    setRevoking(id);
    await fetch(`/api/admin/sessions/${id}`, { method: "DELETE" });
    setRevoking(null);
    load();
  }

  async function revokeAll() {
    if (!confirm("Revoke all other sessions? Those users will be logged out immediately.")) return;
    setRevokingAll(true);
    await fetch("/api/admin/sessions", { method: "DELETE" });
    setRevokingAll(false);
    load();
  }

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Active Sessions</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          {otherCount > 0 && (
            <button
              onClick={revokeAll}
              disabled={revokingAll}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              {revokingAll ? "Revoking…" : `Revoke all others (${otherCount})`}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
          <MonitorDot className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400">No active sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const browser = parseBrowser(s.userAgent);
            const os = parseOS(s.userAgent);
            const expiresInMs = Math.max(0, new Date(s.expiresAt).getTime() - Date.now());
            const expiresInTotal = Math.round(expiresInMs / 60000);
            const expiresHours = Math.floor(expiresInTotal / 60);
            const expiresMinutes = expiresInTotal % 60;
            const expiresLabel = expiresHours > 0
              ? `${expiresHours}h ${expiresMinutes}m`
              : `${expiresMinutes}m`;

            return (
              <div
                key={s.id}
                className={`bg-[#0a0a0a] border rounded-2xl p-5 flex items-center gap-4 ${
                  s.isCurrent ? "border-[#00FF9C]/30" : "border-white/10"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  s.isCurrent ? "bg-[#00FF9C]/15 text-[#00FF9C]" : "bg-white/5 text-gray-400"
                }`}>
                  <MonitorDot size={20} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{s.username}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                      s.role === "superadmin"
                        ? "bg-[#00FF9C]/10 border-[#00FF9C]/20 text-[#00FF9C]"
                        : "bg-white/5 border-white/10 text-gray-400"
                    }`}>
                      {s.role}
                    </span>
                    {s.isCurrent && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/20 text-[#00FF9C] flex items-center gap-1">
                        <Shield size={9} />
                        This session
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Globe size={11} />
                      {s.ip ?? "Unknown IP"}
                    </span>
                    <span>{browser}{os ? ` · ${os}` : ""}</span>
                    <span>
                      Started {new Date(s.createdAt).toLocaleString("en-GB", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        timeZone: "Europe/Sarajevo",
                      })}
                    </span>
                    <span className={expiresInTotal < 30 ? "text-yellow-500" : ""}>
                      Expires in {expiresLabel}
                    </span>
                  </div>
                </div>

                {!s.isCurrent && (
                  <button
                    onClick={() => revokeSession(s.id)}
                    disabled={revoking === s.id}
                    title="Revoke this session"
                    className="shrink-0 p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
