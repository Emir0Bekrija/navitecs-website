"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { TooltipContentProps } from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────

type LabelPoint = { label: string; count: number };
type DayPoint = { day: string; count: number };

type StatsResponse = {
  totals: { applications: number; contacts: number; pageViews: number };
  applicationsByDay: DayPoint[];
  contactsByDay: DayPoint[];
  applicationsByRole: LabelPoint[];
  contactsByProjectType: LabelPoint[];
  projectViews: LabelPoint[];
  pageViewsByPath: LabelPoint[];
  trafficByHour: { hour: number; count: number }[];
  popupClicks: {
    total: number;
    byDay: DayPoint[];
    byTitle: LabelPoint[];
  };
};

// ── Presets ───────────────────────────────────────────────────────────────────

type Preset = "2m" | "3m" | "6m" | "12m" | "thisYear" | "lastYear" | "custom";

function getPresetDates(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === "2m") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { from: fmt(from), to: fmt(now) };
  }
  if (preset === "3m") {
    const from = new Date(now); from.setMonth(from.getMonth() - 3);
    return { from: fmt(from), to: fmt(now) };
  }
  if (preset === "6m") {
    const from = new Date(now); from.setMonth(from.getMonth() - 6);
    return { from: fmt(from), to: fmt(now) };
  }
  if (preset === "thisYear") return { from: `${now.getFullYear()}-01-01`, to: fmt(now) };
  if (preset === "lastYear") {
    const y = now.getFullYear() - 1;
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
  if (preset === "12m") {
    const from = new Date(now); from.setFullYear(from.getFullYear() - 1);
    return { from: fmt(from), to: fmt(now) };
  }
  return { from: "", to: "" };
}

// ── Merge daily ───────────────────────────────────────────────────────────────

function mergeDaily(apps: DayPoint[], contacts: DayPoint[]) {
  const days = new Set([...apps.map((d) => d.day), ...contacts.map((d) => d.day)]);
  const appMap = new Map(apps.map((d) => [d.day, d.count]));
  const contactMap = new Map(contacts.map((d) => [d.day, d.count]));
  return Array.from(days).sort().map((day) => {
    const [y, mo, dd] = day.split("-");
    const label = new Date(Number(y), Number(mo) - 1, Number(dd))
      .toLocaleString("en-GB", { day: "numeric", month: "short" });
    return { day, label, Applications: appMap.get(day) ?? 0, Contacts: contactMap.get(day) ?? 0 };
  });
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-semibold" style={{ color: entry.color as string }}>
          {entry.name}: {entry.value as number}
        </p>
      ))}
    </div>
  );
}

// ── Breakdown ─────────────────────────────────────────────────────────────────

function Breakdown({
  data,
  color,
  emptyText,
  formatLabel,
}: {
  data: LabelPoint[];
  color: string;
  emptyText: string;
  formatLabel?: (label: string) => string;
}) {
  if (!data.length) return <p className="text-gray-500 text-sm">{emptyText}</p>;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300 truncate max-w-[75%]">
              {formatLabel ? formatLabel(d.label) : d.label}
            </span>
            <span className="text-gray-500 shrink-0">{d.count}</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#0a0a0a] border border-white/10 rounded-2xl animate-pulse ${className}`} />;
}

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PRESETS: { key: Preset; label: string }[] = [
  { key: "2m", label: "This & last month" },
  { key: "3m", label: "Last 3 months" },
  { key: "6m", label: "Last 6 months" },
  { key: "12m", label: "Last 12 months" },
  { key: "thisYear", label: "This year" },
  { key: "lastYear", label: "Last year" },
  { key: "custom", label: "Custom" },
];

export default function StatisticsClient() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<Preset>("2m");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  function toggleLine(name: string) {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const { from, to } = preset === "custom" ? { from: customFrom, to: customTo } : getPresetDates(preset);

  const loadStats = useCallback(async () => {
    if (preset === "custom" && (!customFrom || !customTo)) return;
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    const res = await fetch(`/api/admin/dashboard/stats?${params}`);
    if (res.ok) setStats(await res.json());
    setLoading(false);
  }, [from, to, preset, customFrom, customTo]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const mergedDaily = stats ? mergeDaily(stats.applicationsByDay, stats.contactsByDay) : [];
  const xAxisInterval = Math.max(0, Math.ceil(mergedDaily.length / 15) - 1);

  const dim = loading && stats ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity";

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold mb-1">Statistics</h2>
        <p className="text-gray-400 text-sm">Detailed analytics across all tracked metrics</p>
      </div>

      {/* Date range controls */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                preset === p.key
                  ? "bg-[#00AEEF]/20 border border-[#00AEEF]/40 text-[#00AEEF]"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00AEEF]/50 [color-scheme:dark]" />
              <span className="text-gray-600 text-xs">→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00AEEF]/50 [color-scheme:dark]" />
            </div>
          )}
          {loading && <span className="text-xs text-gray-600 animate-pulse ml-auto">Loading…</span>}
        </div>
      </div>

      {/* Summary KPIs */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : stats ? (
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${dim}`}>
          {[
            { label: "Page Views", value: stats.totals.pageViews, color: "#a78bfa" },
            { label: "Applications", value: stats.totals.applications, color: "#00AEEF" },
            { label: "Contact Submissions", value: stats.totals.contacts, color: "#00FF9C" },
            { label: "Popup Clicks", value: stats.popupClicks.total, color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4">
              <div className="text-2xl font-bold mb-0.5" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
              <div className="text-xs text-gray-600 mt-0.5">in period</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Applications & Contacts line chart */}
      <div className={`bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-5 ${loading && !stats ? "" : dim}`}>
        <div>
          <h3 className="font-semibold mb-0.5">Applications & Contact Submissions</h3>
          <p className="text-xs text-gray-500 mb-5">Daily totals — click legend to toggle</p>
          {loading && !stats ? (
            <div className="h-56 animate-pulse bg-white/3 rounded-xl" />
          ) : mergedDaily.length === 0 ? (
            <p className="text-gray-500 text-sm">No data in this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={mergedDaily} margin={{ top: 8, right: 32, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} interval={xAxisInterval} padding={{ left: 8, right: 8 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={(props) => <ChartTooltip {...props} />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "16px", cursor: "pointer" }}
                  onClick={(e) => toggleLine(e.dataKey as string)}
                  formatter={(value) => (
                    <span style={{ color: hiddenLines.has(value) ? "#4b5563" : "#9ca3af", textDecoration: hiddenLines.has(value) ? "line-through" : "none" }}>
                      {value}
                    </span>
                  )}
                />
                <Line type="monotone" dataKey="Applications" stroke="#00AEEF" strokeWidth={2} dot={{ r: 2, fill: "#00AEEF" }} activeDot={{ r: 5 }} hide={hiddenLines.has("Applications")} />
                <Line type="monotone" dataKey="Contacts" stroke="#00FF9C" strokeWidth={2} dot={{ r: 2, fill: "#00FF9C" }} activeDot={{ r: 5 }} hide={hiddenLines.has("Contacts")} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Traffic by hour */}
      {loading && !stats ? (
        <Skeleton className="h-64" />
      ) : stats ? (
        <div className={`bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 ${dim}`}>
          <h3 className="font-semibold mb-0.5">Traffic by Hour of Day</h3>
          <p className="text-xs text-gray-500 mb-5">When your site gets the most visitors (all page views)</p>
          {stats.trafficByHour.every((h) => h.count === 0) ? (
            <p className="text-gray-500 text-sm">No data in this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.trafficByHour} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatHour}
                  interval={2}
                />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const h = payload[0].payload.hour as number;
                    return (
                      <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
                        <p className="text-gray-400 mb-1">{formatHour(h)}</p>
                        <p className="font-semibold text-[#a78bfa]">Views: {payload[0].value as number}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" name="Page Views" fill="#a78bfa" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : null}

      {/* Popup clicks */}
      {loading && !stats ? (
        <Skeleton className="h-64" />
      ) : stats ? (
        <div className={`bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 ${dim}`}>
          <div className="flex items-start justify-between mb-0.5">
            <h3 className="font-semibold">Popup Click-throughs</h3>
            <span className="text-xs text-[#f59e0b] font-semibold">{stats.popupClicks.total} total</span>
          </div>
          <p className="text-xs text-gray-500 mb-5">Clicks on the popup CTA button</p>

          {stats.popupClicks.byDay.length === 0 ? (
            <p className="text-gray-500 text-sm">No popup clicks in this period</p>
          ) : (
            <div className="space-y-6">
              {/* Clicks over time */}
              <ResponsiveContainer width="100%" height={160}>
                <LineChart
                  data={stats.popupClicks.byDay.map((d) => {
                    const [y, mo, dd] = d.day.split("-");
                    const label = new Date(Number(y), Number(mo) - 1, Number(dd))
                      .toLocaleString("en-GB", { day: "numeric", month: "short" });
                    return { ...d, label };
                  })}
                  margin={{ top: 4, right: 16, left: -20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={(props) => <ChartTooltip {...props} />} />
                  <Line type="monotone" dataKey="count" name="Clicks" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2, fill: "#f59e0b" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>

              {/* By popup title/URL */}
              {stats.popupClicks.byTitle.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-3">Breakdown by popup</p>
                  <Breakdown
                    data={stats.popupClicks.byTitle}
                    color="#f59e0b"
                    emptyText=""
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Page Views by path */}
      {loading && !stats ? (
        <Skeleton className="h-64" />
      ) : stats ? (
        <div className={`bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 ${dim}`}>
          <h3 className="font-semibold mb-1">Page Views by Path</h3>
          <p className="text-xs text-gray-500 mb-5">All pages in selected period</p>
          <Breakdown
            data={stats.pageViewsByPath}
            color="#f59e0b"
            emptyText="No page views recorded yet"
            formatLabel={(path) => {
              const map: Record<string, string> = {
                "/home": "Home", "/about": "About", "/services": "Services",
                "/projects": "Projects", "/careers": "Careers", "/contact": "Contact",
              };
              const fallback = path.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Home";
              return map[path] ?? fallback;
            }}
          />
        </div>
      ) : null}

      {/* Applications by role + Contacts by project type */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : stats ? (
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${dim}`}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold mb-1">Applications by Role</h3>
            <p className="text-xs text-gray-500 mb-5">Top roles in selected period</p>
            <Breakdown data={stats.applicationsByRole} color="#00AEEF" emptyText="No applications in this period" />
          </div>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold mb-1">Contacts by Project Type</h3>
            <p className="text-xs text-gray-500 mb-5">Breakdown of inquiry types</p>
            <Breakdown data={stats.contactsByProjectType} color="#00FF9C" emptyText="No contacts in this period" />
          </div>
        </div>
      ) : null}

      {/* Project views */}
      {loading && !stats ? (
        <Skeleton className="h-56" />
      ) : stats ? (
        <div className={`bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 ${dim}`}>
          <h3 className="font-semibold mb-1">Project Views</h3>
          <p className="text-xs text-gray-500 mb-5">Per project in selected period</p>
          <Breakdown
            data={stats.projectViews}
            color="#a78bfa"
            emptyText="No project page views recorded yet"
            formatLabel={(slug) =>
              slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
            }
          />
        </div>
      ) : null}
    </div>
  );
}
