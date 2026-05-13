"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Users,
  Star,
  X,
  Save,
  Search,
  Briefcase,
  Calendar,
} from "lucide-react";

// ── Value formatters ─────────────────────────────────────────────────────────

const EXPERIENCE_LABELS: Record<string, string> = {
  "0-1": "Less than 1 year",
  "1-3": "1 – 3 years",
  "3-5": "3 – 5 years",
  "5-10": "5 – 10 years",
  "10+": "10+ years",
};

const NOTICE_LABELS: Record<string, string> = {
  "2-weeks": "2 weeks",
  "1-month": "1 month",
  "2-months": "2 months",
  "3-months": "3 months",
  "other": "Other / flexible",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type AppSummary = {
  id: string;
  role: string;
  submittedAt: string;
  job?: { id: string; title: string } | null;
  currentlyEmployed?: boolean | null;
  noticePeriod?: string | null;
  yearsOfExperience?: string | null;
  location?: string | null;
  bimSoftware?: string | null;
};

type Applicant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  score: number | null;
  comments: string | null;
  fitsRoles: string | null;
  doesNotFit: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { applications: number };
  applications: AppSummary[];
};

type PagedResponse = {
  data: Applicant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ── Score picker ──────────────────────────────────────────────────────────────

function ScorePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={`w-7 h-7 rounded-md text-xs font-semibold transition-all ${
            value === n
              ? "bg-[#00AEEF] text-black"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          {n}
        </button>
      ))}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-gray-600 hover:text-gray-400 ml-1"
          title="Clear score"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ── Ranking editor panel ──────────────────────────────────────────────────────

function RankingPanel({
  applicant,
  onSaved,
}: {
  applicant: Applicant;
  onSaved: (updated: Pick<Applicant, "score" | "comments" | "fitsRoles" | "doesNotFit">) => void;
}) {
  const [score, setScore] = useState<number | null>(applicant.score);
  const [comments, setComments] = useState(applicant.comments ?? "");
  const [fitsRoles, setFitsRoles] = useState(applicant.fitsRoles ?? "");
  const [doesNotFit, setDoesNotFit] = useState(applicant.doesNotFit ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const prevId = useRef(applicant.id);
  useEffect(() => {
    if (prevId.current !== applicant.id) {
      setScore(applicant.score);
      setComments(applicant.comments ?? "");
      setFitsRoles(applicant.fitsRoles ?? "");
      setDoesNotFit(applicant.doesNotFit ?? "");
      prevId.current = applicant.id;
    }
  }, [applicant]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/applicants/${applicant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score,
        comments: comments || null,
        fitsRoles: fitsRoles || null,
        doesNotFit: doesNotFit || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Review saved");
      onSaved({
        score,
        comments: comments || null,
        fitsRoles: fitsRoles || null,
        doesNotFit: doesNotFit || null,
      });
    }
  }

  return (
    <div className="border border-[#00AEEF]/20 rounded-xl p-4 space-y-3 bg-[#00AEEF]/3">
      <div className="flex items-center gap-2">
        <Star size={14} className="text-[#00AEEF]" />
        <span className="text-xs font-semibold text-[#00AEEF] uppercase tracking-wider">
          Ranking
        </span>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1.5">Score (1–10)</p>
        <ScorePicker value={score} onChange={setScore} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Fits roles / skills</label>
          <textarea
            value={fitsRoles}
            onChange={(e) => setFitsRoles(e.target.value)}
            rows={2}
            placeholder="e.g. BIM Coordination, Revit"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#00AEEF]/50"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Doesn&apos;t fit</label>
          <textarea
            value={doesNotFit}
            onChange={(e) => setDoesNotFit(e.target.value)}
            rows={2}
            placeholder="e.g. Senior management"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-white/20"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Internal notes</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={2}
          placeholder="Private comments visible only to admins"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-white/20"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-[#00AEEF]/15 border border-[#00AEEF]/30 text-[#00AEEF] rounded-lg text-sm hover:bg-[#00AEEF]/25 transition-all disabled:opacity-50"
      >
        <Save size={13} />
        {saving ? "Saving…" : saved ? "Saved!" : "Save ranking"}
      </button>
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

export default function ApplicantsClient() {
  const [result, setResult] = useState<PagedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [minScore, setMinScore] = useState("");
  const [fitsRolesSearch, setFitsRolesSearch] = useState("");
  const [fitsRolesInput, setFitsRolesInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchApplicants = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (minScore) params.set("minScore", minScore);
    if (fitsRolesSearch) params.set("fitsRoles", fitsRolesSearch);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", String(p));
    const data: PagedResponse = await fetch(`/api/admin/applicants?${params.toString()}`).then((r) => r.json());
    setResult(data);
    setLoading(false);
  }, [minScore, fitsRolesSearch, dateFrom, dateTo, page]);

  const filtersRef = useRef({ minScore, fitsRolesSearch, dateFrom, dateTo });
  useEffect(() => {
    const prev = filtersRef.current;
    const changed =
      prev.minScore !== minScore ||
      prev.fitsRolesSearch !== fitsRolesSearch ||
      prev.dateFrom !== dateFrom ||
      prev.dateTo !== dateTo;

    filtersRef.current = { minScore, fitsRolesSearch, dateFrom, dateTo };

    if (changed) {
      setPage(1);
      fetchApplicants(1);
    } else {
      fetchApplicants(page);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minScore, fitsRolesSearch, dateFrom, dateTo, page]);

  function handlePageChange(p: number) {
    setPage(p);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setMinScore("");
    setFitsRolesInput("");
    setFitsRolesSearch("");
    setDateFrom("");
    setDateTo("");
  }

  function handleRankingSaved(
    applicantId: string,
    updated: Pick<Applicant, "score" | "comments" | "fitsRoles" | "doesNotFit">
  ) {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            data: prev.data.map((a) =>
              a.id === applicantId ? { ...a, ...updated } : a
            ),
          }
        : prev
    );
  }

  const hasFilters = minScore || fitsRolesSearch || dateFrom || dateTo;
  const applicants = result?.data ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">Applicants</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {result
            ? `${result.total} applicant${result.total !== 1 ? "s" : ""}${hasFilters ? " (filtered)" : ""}`
            : "Loading…"}
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Score filter */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min score</label>
            <select
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 appearance-none"
            >
              <option value="">Any score</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}+</option>
              ))}
            </select>
          </div>

          {/* Fits role search */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Fits role (search)</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={fitsRolesInput}
                onChange={(e) => setFitsRolesInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setFitsRolesSearch(fitsRolesInput.trim());
                }}
                onBlur={() => setFitsRolesSearch(fitsRolesInput.trim())}
                placeholder="e.g. BIM, Revit…"
                className="w-full bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50"
              />
            </div>
          </div>

          {/* Date range */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Applied from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 [color-scheme:dark]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
            >
              <X size={13} />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
          <Users className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400">
            {hasFilters ? "No applicants match your filters" : "No applicants yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {applicants.map((applicant) => {
              const isExpanded = expandedId === applicant.id;
              const fullName = `${applicant.firstName} ${applicant.lastName}`;
              const mostRecent = applicant.applications[0];

              return (
                <div
                  key={applicant.id}
                  className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
                >
                  {/* Row header */}
                  <button
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : applicant.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#00AEEF]/15 flex items-center justify-center text-[#00AEEF] font-bold shrink-0">
                      {applicant.firstName[0]}
                    </div>

                    {/* Name + email + fitsRoles */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white">{fullName}</p>
                        {applicant.score !== null && applicant.score !== undefined && (
                          <span className="flex items-center gap-1 text-xs text-[#00AEEF] bg-[#00AEEF]/10 border border-[#00AEEF]/20 px-1.5 py-0.5 rounded-full">
                            <Star size={9} fill="currentColor" />
                            {applicant.score}/10
                          </span>
                        )}
                        {applicant._count.applications > 1 && (
                          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                            <Briefcase size={9} />
                            {applicant._count.applications} applications
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{applicant.email}</p>
                      {applicant.fitsRoles && (
                        <p className="text-xs text-[#00FF9C]/70 truncate mt-0.5">
                          Fits: {applicant.fitsRoles}
                        </p>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-gray-500 shrink-0 hidden sm:flex flex-col items-end gap-1">
                      {mostRecent && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(mostRecent.submittedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "Europe/Sarajevo",
                          })}
                        </span>
                      )}
                      <span className="text-gray-600">
                        First applied{" "}
                        {new Date(applicant.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Europe/Sarajevo",
                        })}
                      </span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                      {/* Contact info */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[#00AEEF] text-xs">@</span>
                          <a href={`mailto:${applicant.email}`} className="hover:text-[#00AEEF] transition-colors">
                            {applicant.email}
                          </a>
                        </span>
                        {applicant.phone && (
                          <span className="text-gray-400">{applicant.phone}</span>
                        )}
                      </div>

                      {/* Ranking editor */}
                      <RankingPanel
                        applicant={applicant}
                        onSaved={(updated) => handleRankingSaved(applicant.id, updated)}
                      />

                      {/* Applications list */}
                      {applicant.applications.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Applications ({applicant.applications.length})
                          </p>
                          <div className="space-y-2">
                            {applicant.applications.map((app) => (
                              <div
                                key={app.id}
                                className="px-3 py-2.5 bg-white/3 border border-white/8 rounded-lg space-y-2"
                              >
                                {/* Role + date */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Briefcase size={13} className="text-gray-500 shrink-0" />
                                    <span className="text-sm text-gray-200 truncate">
                                      {app.job?.title ?? app.role}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 shrink-0">
                                    {new Date(app.submittedAt).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      timeZone: "Europe/Sarajevo",
                                    })}{" "}
                                    {new Date(app.submittedAt).toLocaleTimeString("en-GB", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      timeZone: "Europe/Sarajevo",
                                    })}
                                  </span>
                                </div>

                                {/* Applicant details */}
                                {((app.currentlyEmployed !== null && app.currentlyEmployed !== undefined) ||
                                  app.yearsOfExperience || app.location || app.bimSoftware) && (
                                  <div className="bg-black/20 border border-white/6 rounded-lg p-2.5 space-y-2.5 mt-1">
                                    {((app.currentlyEmployed !== null && app.currentlyEmployed !== undefined) ||
                                      app.yearsOfExperience || app.location) && (
                                      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                        {app.currentlyEmployed !== null && app.currentlyEmployed !== undefined && (
                                          <div>
                                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Employment Status</p>
                                            <p className={`text-xs font-medium ${app.currentlyEmployed ? "text-amber-400" : "text-[#00FF9C]"}`}>
                                              {app.currentlyEmployed ? "Currently employed" : "Available immediately"}
                                            </p>
                                          </div>
                                        )}
                                        {app.currentlyEmployed && app.noticePeriod && (
                                          <div>
                                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Notice Period</p>
                                            <p className="text-xs text-gray-200">{NOTICE_LABELS[app.noticePeriod] ?? app.noticePeriod}</p>
                                          </div>
                                        )}
                                        {app.yearsOfExperience && (
                                          <div>
                                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Work Experience</p>
                                            <p className="text-xs text-gray-200">{EXPERIENCE_LABELS[app.yearsOfExperience] ?? app.yearsOfExperience}</p>
                                          </div>
                                        )}
                                        {app.location && (
                                          <div>
                                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Current Location</p>
                                            <p className="text-xs text-gray-200">{app.location}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {app.bimSoftware && (
                                      <div>
                                        {((app.currentlyEmployed !== null && app.currentlyEmployed !== undefined) ||
                                          app.yearsOfExperience || app.location) && (
                                          <div className="border-t border-white/6 mb-2" />
                                        )}
                                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Skills & Proficiency</p>
                                        <div className="flex flex-wrap gap-1">
                                          {app.bimSoftware.split(",").map((s) => s.trim()).filter(Boolean).map((tool) => (
                                            <span key={tool} className="px-1.5 py-0.5 rounded-md text-xs bg-[#00AEEF]/10 border border-[#00AEEF]/20 text-[#00AEEF]">
                                              {tool}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {result && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              pageSize={result.pageSize}
              onChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
