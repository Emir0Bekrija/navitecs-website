"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollText, RefreshCw, ChevronLeft, ChevronRight,
  X, Search, Calendar, User, Globe, AlertTriangle,
} from "lucide-react";

type LogEntry = {
  id: number;
  action: string;
  ip: string | null;
  username: string | null;
  userId: number | null;
  metadata: unknown;
  createdAt: string;
};

// ── Action display config ─────────────────────────────────────────────────────

const ACTION_STYLES: Record<string, string> = {
  login_success:            "text-[#00FF9C] bg-[#00FF9C]/10 border-[#00FF9C]/20",
  login_failed:             "text-red-400 bg-red-500/10 border-red-500/20",
  logout:                   "text-gray-400 bg-white/5 border-white/10",
  session_revoked:          "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  sessions_revoke_all:      "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  password_changed:         "text-[#00AEEF] bg-[#00AEEF]/10 border-[#00AEEF]/20",
  user_created:             "text-[#00AEEF] bg-[#00AEEF]/10 border-[#00AEEF]/20",
  user_deleted:             "text-red-400 bg-red-500/10 border-red-500/20",
  verify_password_lockout:  "text-red-400 bg-red-500/10 border-red-500/20",
};

const ACTION_LABELS: Record<string, string> = {
  login_success:            "Login",
  login_failed:             "Failed login",
  logout:                   "Logout",
  session_revoked:          "Session revoked",
  sessions_revoke_all:      "All sessions revoked",
  password_changed:         "Password changed",
  user_created:             "User created",
  user_deleted:             "User deleted",
  verify_password_lockout:  "Password lockout",
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

// ── Metadata renderer ─────────────────────────────────────────────────────────

function MetaValue({ k, v }: { k: string; v: unknown }) {
  if (typeof v === "boolean") {
    if (k === "flaggedAsSuspicious" || k === "suspicious") {
      return v
        ? <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">Suspicious</span>
        : <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">Clean</span>;
    }
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${v ? "bg-[#00FF9C]/15 text-[#00FF9C]" : "bg-white/5 text-gray-400"}`}>{v ? "true" : "false"}</span>;
  }
  if (v === null || v === undefined) return <span className="text-gray-600">—</span>;
  if (typeof v === "object") {
    return (
      <pre className="text-xs text-gray-300 bg-[#0a0a0a] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-words">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  return <span className="text-gray-200 text-sm break-words">{String(v)}</span>;
}

function MetadataPanel({ metadata }: { metadata: unknown }) {
  if (!metadata || typeof metadata !== "object") {
    return <p className="text-gray-500 text-sm">No metadata</p>;
  }
  const entries = Object.entries(metadata as Record<string, unknown>);
  if (entries.length === 0) return <p className="text-gray-500 text-sm">No metadata</p>;

  const KEY_LABELS: Record<string, string> = {
    flaggedAsSuspicious: "Flagged as suspicious",
    note:                "Note",
    action:              "Action hint",
    targetUserId:        "Target user ID",
    targetUsername:      "Target username",
    reason:              "Reason",
    userAgent:           "User agent",
  };

  return (
    <dl className="space-y-3">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {KEY_LABELS[k] ?? k.replace(/_/g, " ")}
          </dt>
          <dd>
            <MetaValue k={k} v={v} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function DetailModal({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  const style = ACTION_STYLES[log.action] ?? "text-gray-400 bg-white/5 border-white/10";
  const label = ACTION_LABELS[log.action] ?? log.action.replace(/_/g, " ");
  const isSuspicious: boolean =
    !!log.metadata &&
    typeof log.metadata === "object" &&
    (log.metadata as Record<string, unknown>).flaggedAsSuspicious === true;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {isSuspicious && (
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
            )}
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${style}`}>
                {label}
              </span>
              <p className="text-xs text-gray-500 mt-1">Event #{log.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Timestamp</p>
              <p className="text-sm text-gray-200">
                {new Date(log.createdAt).toLocaleString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                  timeZone: "Europe/Sarajevo",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">User</p>
              <p className="text-sm text-gray-200">
                {log.username
                  ? <>{log.username}{log.userId ? <span className="text-gray-600 ml-1 text-xs">(ID {log.userId})</span> : null}</>
                  : <span className="text-gray-600">—</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">IP Address</p>
              <p className="text-sm font-mono text-gray-200">{log.ip ? log.ip : <span className="text-gray-600">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Action key</p>
              <p className="text-xs font-mono text-gray-400">{log.action}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Metadata</p>
            <MetadataPanel metadata={log.metadata} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

type Filters = {
  action: string;
  ip: string;
  username: string;
  dateFrom: string;
  dateTo: string;
};

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  function set(key: keyof Filters, val: string) {
    onChange({ ...filters, [key]: val });
  }

  const hasFilters = filters.action || filters.ip || filters.username || filters.dateFrom || filters.dateTo;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* Action */}
        <select
          value={filters.action}
          onChange={(e) => set("action", e.target.value)}
          className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/40 appearance-none"
        >
          <option value="">All events</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
          ))}
        </select>

        {/* Username */}
        <div className="relative">
          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Username"
            value={filters.username}
            onChange={(e) => set("username", e.target.value)}
            className="bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF9C]/40 w-36"
          />
        </div>

        {/* IP */}
        <div className="relative">
          <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="IP address"
            value={filters.ip}
            onChange={(e) => set("ip", e.target.value)}
            className="bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF9C]/40 w-36"
          />
        </div>

        {/* Date from */}
        <div className="relative">
          <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
            className="bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/40 [color-scheme:dark]"
          />
        </div>

        {/* Date to */}
        <div className="relative">
          <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
            className="bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/40 [color-scheme:dark]"
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => onChange({ action: "", ip: "", username: "", dateFrom: "", dateTo: "" })}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-gray-500">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-600 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                p === page
                  ? "bg-[#00AEEF] text-black"
                  : "border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AuditLogClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [filters, setFilters] = useState<Filters>({
    action: "", ip: "", username: "", dateFrom: "", dateTo: "",
  });

  // Debounce text inputs so we don't fire on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  function handleFilterChange(f: Filters) {
    setFilters(f);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedFilters(f), 400);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedFilters.action)   params.set("action",   debouncedFilters.action);
    if (debouncedFilters.ip)       params.set("ip",       debouncedFilters.ip);
    if (debouncedFilters.username) params.set("username", debouncedFilters.username);
    if (debouncedFilters.dateFrom) params.set("dateFrom", debouncedFilters.dateFrom);
    if (debouncedFilters.dateTo)   params.set("dateTo",   debouncedFilters.dateTo);
    const res = await fetch(`/api/admin/audit-log?${params}`);
    if (res.ok) {
      const data = await res.json() as {
        data: LogEntry[];
        total: number;
        pageSize: number;
        totalPages: number;
      };
      setLogs(data.data);
      setTotal(data.total);
      setPageSize(data.pageSize);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, debouncedFilters]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedFilters]);

  function handlePageChange(p: number) {
    setPage(p);
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Audit Log</h2>
          <p className="text-gray-400 text-sm mt-0.5">{total} event{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={handleFilterChange} />

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 animate-pulse h-14" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
          <ScrollText className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400">No events match the current filters</p>
        </div>
      ) : (
        <>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Event</th>
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">IP Address</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Summary</th>
                  <th className="text-right px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const style = ACTION_STYLES[log.action] ?? "text-gray-400 bg-white/5 border-white/10";
                  const label = ACTION_LABELS[log.action] ?? log.action.replace(/_/g, " ");
                  const meta = log.metadata && typeof log.metadata === "object"
                    ? log.metadata as Record<string, unknown>
                    : null;
                  const isSuspicious = meta?.flaggedAsSuspicious === true;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(log)}
                      className={`border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-white/3 ${i % 2 === 1 ? "bg-white/[0.01]" : ""} ${isSuspicious ? "border-l-2 border-l-red-500/40" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {isSuspicious && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style}`}>
                            {label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-300">{log.username ?? "—"}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-400 hidden md:table-cell">{log.ip ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 hidden lg:table-cell max-w-xs">
                        <span className="truncate block">
                          {meta
                            ? Object.entries(meta)
                                .filter(([k]) => k !== "flaggedAsSuspicious")
                                .slice(0, 2)
                                .map(([k, v]) => `${k}: ${typeof v === "object" ? "…" : String(v)}`)
                                .join(" · ") || "—"
                            : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-GB", {
                          day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit", second: "2-digit",
                          timeZone: "Europe/Sarajevo",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onChange={handlePageChange}
          />
        </>
      )}

      {/* Detail modal */}
      {selected && <DetailModal log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
