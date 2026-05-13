"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Building2,
  Star,
  X,
  Save,
  Search,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ContactEntry = {
  id: string;
  projectType: string | null;
  service: string | null;
  projectServices: string | null;
  message: string;
  submittedAt: string;
};

type CompanyContact = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  score: number | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: ContactEntry[];
};

type PagedResponse = {
  data: CompanyContact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ── Score picker ───────────────────────────────────────────────────────────────

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
              ? "bg-[#00FF9C] text-black"
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

// ── Lead ranking panel ────────────────────────────────────────────────────────

function RankingPanel({
  contact,
  onSaved,
}: {
  contact: CompanyContact;
  onSaved: (updated: Pick<CompanyContact, "score" | "comments">) => void;
}) {
  const [score, setScore] = useState<number | null>(contact.score);
  const [comments, setComments] = useState(contact.comments ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const prevId = useRef(contact.id);
  useEffect(() => {
    if (prevId.current !== contact.id) {
      setScore(contact.score);
      setComments(contact.comments ?? "");
      prevId.current = contact.id;
    }
  }, [contact]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/company-contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, comments: comments || null }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved({ score, comments: comments || null });
    }
  }

  return (
    <div className="border border-[#00FF9C]/20 rounded-xl p-4 space-y-3 bg-[#00FF9C]/3">
      <div className="flex items-center gap-2">
        <Star size={14} className="text-[#00FF9C]" />
        <span className="text-xs font-semibold text-[#00FF9C] uppercase tracking-wider">
          Lead Ranking
        </span>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1.5">Score (1–10)</p>
        <ScorePicker value={score} onChange={setScore} />
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
        className="flex items-center gap-2 px-4 py-2 bg-[#00FF9C]/10 border border-[#00FF9C]/25 text-[#00FF9C] rounded-lg text-sm hover:bg-[#00FF9C]/20 transition-all disabled:opacity-50"
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
                  ? "bg-[#00FF9C] text-black"
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

export default function CompanyContactsClient() {
  const [result, setResult] = useState<PagedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchContacts = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (nameFilter) params.set("name", nameFilter);
    if (emailFilter) params.set("email", emailFilter);
    if (companyFilter) params.set("company", companyFilter);
    if (minScore) params.set("minScore", minScore);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", String(p));
    const data: PagedResponse = await fetch(
      `/api/admin/company-contacts?${params.toString()}`
    ).then((r) => r.json());
    setResult(data);
    setLoading(false);
  }, [nameFilter, emailFilter, companyFilter, minScore, dateFrom, dateTo, page]);

  const filtersRef = useRef({ nameFilter, emailFilter, companyFilter, minScore, dateFrom, dateTo });
  useEffect(() => {
    const prev = filtersRef.current;
    const changed =
      prev.nameFilter !== nameFilter ||
      prev.emailFilter !== emailFilter ||
      prev.companyFilter !== companyFilter ||
      prev.minScore !== minScore ||
      prev.dateFrom !== dateFrom ||
      prev.dateTo !== dateTo;

    filtersRef.current = { nameFilter, emailFilter, companyFilter, minScore, dateFrom, dateTo };

    if (changed) {
      setPage(1);
      fetchContacts(1);
    } else {
      fetchContacts(page);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFilter, emailFilter, companyFilter, minScore, dateFrom, dateTo, page]);

  function handlePageChange(p: number) {
    setPage(p);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setNameFilter("");
    setEmailFilter("");
    setCompanyFilter("");
    setMinScore("");
    setDateFrom("");
    setDateTo("");
  }

  function handleRankingSaved(
    contactId: string,
    updated: Pick<CompanyContact, "score" | "comments">
  ) {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            data: prev.data.map((c) =>
              c.id === contactId ? { ...c, ...updated } : c
            ),
          }
        : prev
    );
  }

  const hasFilters = nameFilter || emailFilter || companyFilter || minScore || dateFrom || dateTo;
  const contacts = result?.data ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">Company Contacts</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {result
            ? `${result.total} contact${result.total !== 1 ? "s" : ""}${hasFilters ? " (filtered)" : ""}`
            : "Loading…"}
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Name</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search by name…"
                className="w-full bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF9C]/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                placeholder="Search by email…"
                className="w-full bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF9C]/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Company</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                placeholder="Search by company…"
                className="w-full bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF9C]/50"
              />
            </div>
          </div>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min score</label>
            <select
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/50 appearance-none"
            >
              <option value="">Any score</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}+</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/50 [color-scheme:dark]"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
          <Building2 className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400">
            {hasFilters ? "No contacts match your filters" : "No company contacts yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {contacts.map((contact) => {
              const isExpanded = expandedId === contact.id;
              const mostRecent = contact.contacts[0];

              return (
                <div
                  key={contact.id}
                  className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
                >
                  {/* Row header */}
                  <button
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#00FF9C]/15 flex items-center justify-center text-[#00FF9C] font-bold shrink-0">
                      {contact.name[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white">{contact.name}</p>
                        {contact.score !== null && contact.score !== undefined && (
                          <span className="flex items-center gap-1 text-xs text-[#00FF9C] bg-[#00FF9C]/10 border border-[#00FF9C]/20 px-1.5 py-0.5 rounded-full">
                            <Star size={9} fill="currentColor" />
                            {contact.score}/10
                          </span>
                        )}
                        {contact.contacts.length > 1 && (
                          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                            <Building2 size={9} />
                            {contact.contacts.length} submissions
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {contact.company ? `${contact.company} · ${contact.email}` : contact.email}
                      </p>
                    </div>

                    <div className="text-xs text-gray-500 shrink-0 hidden sm:flex flex-col items-end gap-1">
                      {mostRecent && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(mostRecent.submittedAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Sarajevo",
                          })}
                        </span>
                      )}
                      <span className="text-gray-600">
                        First contact{" "}
                        {new Date(contact.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Sarajevo",
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
                      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} className="text-[#00FF9C] shrink-0" />
                          <a href={`mailto:${contact.email}`} className="hover:text-[#00FF9C] transition-colors">
                            {contact.email}
                          </a>
                        </span>
                        {contact.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone size={13} className="text-[#00FF9C] shrink-0" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.company && (
                          <span className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-[#00FF9C] shrink-0" />
                            {contact.company}
                          </span>
                        )}
                      </div>

                      {/* Lead ranking */}
                      <RankingPanel
                        contact={contact}
                        onSaved={(updated) => handleRankingSaved(contact.id, updated)}
                      />

                      {/* Submissions list */}
                      {contact.contacts.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Submissions ({contact.contacts.length})
                          </p>
                          <div className="space-y-2">
                            {contact.contacts.map((sub) => (
                              <div
                                key={sub.id}
                                className="px-3 py-2.5 bg-white/3 border border-white/8 rounded-lg space-y-2"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    {sub.projectType && (
                                      <span className="px-2 py-0.5 rounded-md text-xs bg-[#00FF9C]/10 border border-[#00FF9C]/20 text-[#00FF9C]">
                                        {sub.projectType}
                                      </span>
                                    )}
                                    {sub.service && (
                                      <span className="px-2 py-0.5 rounded-md text-xs bg-white/5 border border-white/10 text-gray-400">
                                        {sub.service}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 shrink-0">
                                    {new Date(sub.submittedAt).toLocaleDateString("en-GB", {
                                      day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Sarajevo",
                                    })}{" "}
                                    {new Date(sub.submittedAt).toLocaleTimeString("en-GB", {
                                      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sarajevo",
                                    })}
                                  </span>
                                </div>

                                {sub.projectServices && (
                                  <div className="flex flex-wrap gap-1">
                                    {sub.projectServices.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                                      <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-[#00AEEF]/10 border border-[#00AEEF]/20 text-[#00AEEF]">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                                  {sub.message}
                                </p>
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
