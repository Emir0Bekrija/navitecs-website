"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  MessageSquare,
  FolderKanban,
  ArrowRight,
  Users,
  Building2,
  BarChart2,
  Eye,
  MousePointerClick,
  Clock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Totals = {
  totalJobs: number;
  activeJobs: number;
  totalProjects: number;
  totalApplicants: number;
  totalCompanyContacts: number;
};

type QuickStats = {
  pageViewsToday: number;
  pageViewsThisWeek: number;
  popupClicksTotal: number;
  popupClicksToday: number;
  avgSessionDuration: number | null;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-[#0a0a0a] border border-white/10 rounded-2xl animate-pulse ${className}`} />
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DashboardClient() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [quick, setQuick] = useState<QuickStats | null>(null);
  const totalsLoaded = useRef(false);

  useEffect(() => {
    if (totalsLoaded.current) return;
    totalsLoaded.current = true;
    Promise.all([
      fetch("/api/admin/dashboard/totals").then((r) => r.json()),
      fetch("/api/admin/dashboard/quick").then((r) => r.json()),
    ])
      .then(([t, q]) => {
        setTotals(t);
        setQuick(q);
      })
      .catch(() => {});
  }, []);

  const loaded = totals && quick;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-gray-400 text-sm">Overview of your site activity</p>
      </div>

      {/* Stat cards */}
      {!loaded ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Jobs", value: totals.activeJobs, sub: `${totals.totalJobs} total`, icon: Briefcase, href: "/navitecs-control-admin/jobs", color: "#00AEEF" },
            { label: "Projects", value: totals.totalProjects, sub: "in portfolio", icon: FolderKanban, href: "/navitecs-control-admin/projects", color: "#00FF9C" },
            { label: "Total Applicants", value: totals.totalApplicants, sub: "unique people", icon: Users, href: "/navitecs-control-admin/applicants", color: "#00AEEF" },
            { label: "Company Contacts", value: totals.totalCompanyContacts, sub: "unique companies", icon: Building2, href: "/navitecs-control-admin/company-contacts", color: "#00FF9C" },
            { label: "Applications", value: totals.totalApplicants, sub: "all time", icon: FileText, href: "/navitecs-control-admin/applications", color: "#00AEEF" },
            { label: "Page Views Today", value: quick.pageViewsToday, sub: `${quick.pageViewsThisWeek} this week`, icon: Eye, href: "/navitecs-control-admin/statistics", color: "#a78bfa" },
          ].map(({ label, value, sub, icon: Icon, href, color }) => (
            <Link
              key={label}
              href={href}
              className="group bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold mb-0.5" style={{ color }}>{value}</div>
              <div className="text-xs font-medium text-white">{label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Statistics mini section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Statistics</h3>
          <Link
            href="/navitecs-control-admin/statistics"
            className="flex items-center gap-1.5 text-xs text-[#00AEEF] hover:text-[#00AEEF]/80 transition-colors"
          >
            View full statistics
            <ArrowRight size={12} />
          </Link>
        </div>

        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Popup Clicks */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#f59e0b]/10">
                  <MousePointerClick size={16} className="text-[#f59e0b]" />
                </div>
                <span className="text-xs text-gray-500">Popup Clicks</span>
              </div>
              <div className="text-2xl font-bold text-[#f59e0b]">{quick.popupClicksTotal}</div>
              <div className="text-xs text-gray-600 mt-0.5">{quick.popupClicksToday} today</div>
            </div>

            {/* Page Views */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#a78bfa]/10">
                  <BarChart2 size={16} className="text-[#a78bfa]" />
                </div>
                <span className="text-xs text-gray-500">Page Views</span>
              </div>
              <div className="text-2xl font-bold text-[#a78bfa]">{quick.pageViewsThisWeek}</div>
              <div className="text-xs text-gray-600 mt-0.5">last 7 days</div>
            </div>

            {/* Avg Session */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#00FF9C]/10">
                  <Clock size={16} className="text-[#00FF9C]" />
                </div>
                <span className="text-xs text-gray-500">Avg. Session</span>
              </div>
              <div className="text-2xl font-bold text-[#00FF9C]">
                {quick.avgSessionDuration ? formatDuration(quick.avgSessionDuration) : "—"}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">last 7 days</div>
            </div>
          </div>
        )}

        {loaded && (
          <Link
            href="/navitecs-control-admin/statistics"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all"
          >
            <BarChart2 size={16} />
            Open full statistics dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
