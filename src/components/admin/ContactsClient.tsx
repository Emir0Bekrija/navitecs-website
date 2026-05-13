"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Mail,
  Phone,
  Building2,
  Reply,
  Star,
  X,
  Save,
  RefreshCw,
  Bell,
  HelpCircle,
  Download,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import type { ContactSubmission, CompanyContactRanking } from "@/types/index";
import ThunderbirdSetupModal from "./ThunderbirdSetupModal";
import { useAdminStream } from "@/hooks/useAdminStream";

const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Infrastructure",
  "Interior Design",
  "Urban Planning",
  "Other",
];

const PROJECT_SERVICES = [
  "Structural Analysis",
  "Thermal Analysis",
  "Seismic Analysis",
  "Retrofitting",
  "Custom Solutions",
];

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

// ── Company contact ranking panel ─────────────────────────────────────────────
function CompanyContactPanel({
  contact,
  onSaved,
}: {
  contact: CompanyContactRanking;
  onSaved: (updated: CompanyContactRanking) => void;
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
      toast.success("Review saved");
      onSaved({ ...contact, score, comments: comments || null });
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
        <label className="text-xs text-gray-500 block mb-1">
          Internal notes
        </label>
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

// ── Export modal ──────────────────────────────────────────────────────────────
function ExportModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"stale" | "range">("stale");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleExport() {
    if (!password) { setError("Password is required."); return; }
    if (mode === "range" && !dateFrom && !dateTo) {
      setError("Please select at least one date for the custom range.");
      return;
    }
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/contacts/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, mode, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    });

    setLoading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string };
      setError(json.error ?? "Export failed. Please try again.");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "company_contacts.xlsx";
    a.click();
    URL.revokeObjectURL(url);

    setSuccess(true);
    setTimeout(() => onClose(), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-6 max-w-md w-full mx-4 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00FF9C]/10 flex items-center justify-center shrink-0">
              <Download size={18} className="text-[#00FF9C]" />
            </div>
            <div>
              <p className="font-semibold text-white">Export Contacts</p>
              <p className="text-xs text-gray-500">Generate an Excel file (.xlsx)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-[#00FF9C] font-medium">Export successful!</p>
            <p className="text-xs text-gray-500">Your file has been downloaded.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Export type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("stale")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all text-left ${
                    mode === "stale"
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-white/3 border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <Clock size={14} />
                  <div>
                    <div className="font-medium">Older than 12 mo</div>
                    <div className="text-[10px] opacity-70">Export + delete</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("range")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all text-left ${
                    mode === "range"
                      ? "bg-[#00FF9C]/10 border-[#00FF9C]/30 text-[#00FF9C]"
                      : "bg-white/3 border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <Download size={14} />
                  <div>
                    <div className="font-medium">Custom period</div>
                    <div className="text-[10px] opacity-70">Export only</div>
                  </div>
                </button>
              </div>
            </div>

            {mode === "range" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/50 [color-scheme:dark]"
                  />
                </div>
              </div>
            )}

            {mode === "stale" && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/5 border border-red-500/20 rounded-lg text-xs text-red-400">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                Records older than 12 months will be permanently deleted after export. This cannot be undone.
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Confirm with your admin password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Your password"
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FF9C]/50 pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleExport()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-lg text-sm hover:border-white/20 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                  mode === "stale"
                    ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                    : "bg-[#00FF9C]/10 border border-[#00FF9C]/30 text-[#00FF9C] hover:bg-[#00FF9C]/20"
                }`}
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                {loading ? "Exporting…" : mode === "stale" ? "Export & Delete" : "Export"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ContactsClient() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMailSetup, setShowMailSetup] = useState(false);

  // Filters
  const [emailFilter, setEmailFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Export modal
  const [showExport, setShowExport] = useState(false);

  // Stale count
  const [staleCount, setStaleCount] = useState<{ staleContacts: number; staleCompanyContacts: number } | null>(null);

  // Real-time notifications
  const [newCount, setNewCount] = useState(0);
  const onNewContact = useCallback(() => setNewCount((n) => n + 1), []);
  useAdminStream("new_contact", onNewContact);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (emailFilter) params.set("email", emailFilter);
    if (nameFilter) params.set("name", nameFilter);
    if (projectTypeFilter) params.set("projectType", projectTypeFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const qs = params.toString();
    const data = await fetch(`/api/admin/contacts${qs ? `?${qs}` : ""}`).then(
      (r) => r.json(),
    );
    setContacts(data);
    setLoading(false);
  }, [emailFilter, nameFilter, projectTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchContacts();
    fetch("/api/admin/contacts/stale-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStaleCount(data); });
  }, [fetchContacts]);

  function clearFilters() {
    setEmailFilter("");
    setNameFilter("");
    setProjectTypeFilter("");
    setDateFrom("");
    setDateTo("");
  }

  function loadNew() {
    setNewCount(0);
    setExpandedId(null);
    fetchContacts();
  }

  const hasFilters =
    emailFilter || nameFilter || projectTypeFilter || dateFrom || dateTo;

  function handleCompanyContactSaved(
    contactId: string,
    updated: CompanyContactRanking,
  ) {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, companyContact: updated } : c,
      ),
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Contact Submissions</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {contacts.length} result{contacts.length !== 1 ? "s" : ""}
            {hasFilters ? " (filtered)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#00FF9C] border border-[#00FF9C]/25 rounded-lg hover:bg-[#00FF9C]/10 transition-colors"
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={() => setShowMailSetup(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white hover:border-white/25 transition-colors"
          >
            <HelpCircle size={13} />
            Mail client setup
          </button>
        </div>
      </div>

      {/* Stale data banner */}
      {staleCount && staleCount.staleContacts > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-500/8 border border-amber-500/25 rounded-xl text-sm">
          <div className="flex items-center gap-2 text-amber-400">
            <Clock size={14} className="shrink-0" />
            <span>
              <span className="font-semibold">{staleCount.staleContacts}</span> contact{staleCount.staleContacts !== 1 ? "s" : ""} older than 12 months
              {staleCount.staleCompanyContacts > 0 && (
                <> · <span className="font-semibold">{staleCount.staleCompanyContacts}</span> company contact{staleCount.staleCompanyContacts !== 1 ? "s" : ""} eligible for removal</>
              )}
            </span>
          </div>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/25 transition-all whitespace-nowrap"
          >
            <Download size={12} />
            Export &amp; delete
          </button>
        </div>
      )}

      {/* New items banner */}
      {newCount > 0 && (
        <button
          onClick={loadNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00FF9C]/10 border border-[#00FF9C]/30 text-[#00FF9C] rounded-2xl text-sm font-medium hover:bg-[#00FF9C]/20 transition-all animate-pulse"
        >
          <Bell size={15} />
          {newCount} new contact{newCount !== 1 ? "s" : ""} received — click to
          load
        </button>
      )}

      {/* Filter bar */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Name</label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF9C]/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input
              type="text"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Search by email…"
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF9C]/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Project type
            </label>
            <select
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/50 appearance-none"
            >
              <option value="">All types</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
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

          <div className="flex gap-2 pb-0.5">
            <button
              onClick={fetchContacts}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
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
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse h-24"
            />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
          <MessageSquare className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400">
            {hasFilters
              ? "No contacts match your filters"
              : "No contact submissions yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => {
            const isExpanded = expandedId === contact.id;
            const score = contact.companyContact?.score;

            return (
              <div
                key={contact.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
              >
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
                      {score !== null && score !== undefined && (
                        <span className="flex items-center gap-1 text-xs text-[#00FF9C] bg-[#00FF9C]/10 border border-[#00FF9C]/20 px-1.5 py-0.5 rounded-full">
                          <Star size={9} fill="currentColor" />
                          {score}/10
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {contact.company
                        ? `${contact.company} · ${contact.projectType || contact.email}`
                        : contact.projectType || contact.email}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 shrink-0 hidden sm:block text-right">
                    <div>
                      {new Date(contact.submittedAt).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Sarajevo" },
                      )}
                    </div>
                    <div>
                      {new Date(contact.submittedAt).toLocaleTimeString(
                        "en-GB",
                        { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sarajevo" },
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail size={14} className="text-[#00FF9C] shrink-0" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="hover:text-[#00FF9C] transition-colors truncate"
                        >
                          {contact.email}
                        </a>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone
                            size={14}
                            className="text-[#00FF9C] shrink-0"
                          />
                          {contact.phone}
                        </div>
                      )}
                      {contact.company && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Building2
                            size={14}
                            className="text-[#00FF9C] shrink-0"
                          />
                          {contact.company}
                        </div>
                      )}
                      {contact.projectType && (
                        <div className="text-gray-300">
                          <span className="text-gray-500">Project Type: </span>
                          {contact.projectType}
                        </div>
                      )}
                      {contact.service && (
                        <div className="text-gray-300">
                          <span className="text-gray-500">Service: </span>
                          {contact.service}
                        </div>
                      )}
                    </div>

                    {/* Services required */}
                    {contact.projectServices && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Services Required
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {contact.projectServices.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                            <span
                              key={s}
                              className="px-2.5 py-1 rounded-md text-xs bg-[#00FF9C]/10 border border-[#00FF9C]/20 text-[#00FF9C]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Message
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {contact.message}
                      </p>
                    </div>

                    {/* Company contact ranking */}
                    {contact.companyContact && (
                      <CompanyContactPanel
                        contact={contact.companyContact}
                        onSaved={(updated) =>
                          handleCompanyContactSaved(contact.id, updated)
                        }
                      />
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <a
                        href={`mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(`Re: ${contact.projectType ? `${contact.projectType} inquiry` : "Your inquiry"}`)}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00FF9C]/15 to-[#00AEEF]/15 border border-[#00FF9C]/30 text-white rounded-lg text-sm hover:from-[#00FF9C]/25 hover:to-[#00AEEF]/25 transition-all"
                      >
                        <Reply size={14} />
                        Reply via Email
                      </a>
                      <p className="text-xs text-gray-600">
                        {new Date(contact.submittedAt).toLocaleString("en-GB", {
                          dateStyle: "long",
                          timeStyle: "short",
                          timeZone: "Europe/Sarajevo",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showMailSetup && <ThunderbirdSetupModal onClose={() => setShowMailSetup(false)} />}

      {/* Export modal */}
      {showExport && (
        <ExportModal
          onClose={() => {
            setShowExport(false);
            fetch("/api/admin/contacts/stale-count")
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => { if (data) setStaleCount(data); });
            fetchContacts();
          }}
        />
      )}
    </div>
  );
}
