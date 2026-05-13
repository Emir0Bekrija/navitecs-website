"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LinkedinIcon = ({
  size = 13,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  Phone,
  Globe,
  FileDown,
  Reply,
  Star,
  X,
  Save,
  Users,
  Bell,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Download,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import type {
  GroupedApplicant,
  ApplicationEntry,
  ApplicantRanking,
  Job,
} from "@/types/index";
import ThunderbirdSetupModal from "./ThunderbirdSetupModal";
import { useAdminStream } from "@/hooks/useAdminStream";

type PagedResponse = {
  data: GroupedApplicant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ── Delete confirmation dialog ────────────────────────────────────────────────
function DeleteDialog({
  name,
  role,
  loading,
  onConfirm,
  onCancel,
}: {
  name: string;
  role: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0d0d0d] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Delete Application</p>
            <p className="text-xs text-gray-500">
              This action cannot be undone
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          Delete <span className="text-white font-medium">{name}</span>&apos;s
          application for <span className="text-white font-medium">{role}</span>
          ? The uploaded CV will also be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-lg text-sm hover:border-white/20 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 size={13} />
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Score picker: 1–10 buttons ────────────────────────────────────────────────
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

// ── Applicant ranking panel ───────────────────────────────────────────────────
function ApplicantPanel({
  applicant,
  onSaved,
}: {
  applicant: ApplicantRanking;
  onSaved: (updated: ApplicantRanking) => void;
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
      onSaved({
        ...applicant,
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
          Applicant Ranking
        </span>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1.5">Score (1–10)</p>
        <ScorePicker value={score} onChange={setScore} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Fits roles / skills
          </label>
          <textarea
            value={fitsRoles}
            onChange={(e) => setFitsRoles(e.target.value)}
            rows={2}
            placeholder="e.g. BIM Coordination, Revit"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#00AEEF]/50"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Doesn&apos;t fit
          </label>
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
        className="flex items-center gap-2 px-4 py-2 bg-[#00AEEF]/15 border border-[#00AEEF]/30 text-[#00AEEF] rounded-lg text-sm hover:bg-[#00AEEF]/25 transition-all disabled:opacity-50"
      >
        <Save size={13} />
        {saving ? "Saving…" : saved ? "Saved!" : "Save ranking"}
      </button>
    </div>
  );
}

// ── Value formatters ──────────────────────────────────────────────────────────
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
  other: "Other / flexible",
};

// ── CV section with deletable toggle ─────────────────────────────────────────
function CvSection({
  app,
  onCvDeleted,
}: {
  app: ApplicationEntry;
  onCvDeleted: () => void;
}) {
  const [deletable, setDeletable] = useState(app.cvDeletable);
  const [togglingDeletable, setTogglingDeletable] = useState(false);
  const [deletingCv, setDeletingCv] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const displayName = (app.cvFileName ?? "cv.pdf").replace(/^\d{10,}-/, "");

  async function toggleDeletable(checked: boolean) {
    setTogglingDeletable(true);
    const res = await fetch(`/api/admin/applications/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvDeletable: checked }),
    });
    if (res.ok) setDeletable(checked);
    if (!checked) setConfirmDelete(false);
    setTogglingDeletable(false);
  }

  async function handleDeleteCv() {
    setDeletingCv(true);
    const res = await fetch(`/api/admin/applications/${app.id}/cv`, {
      method: "DELETE",
    });
    setDeletingCv(false);
    if (res.ok) {
      setConfirmDelete(false);
      onCvDeleted();
    }
  }

  return (
    <div className="space-y-2">
      {/* Download link */}
      <a
        href={`/api/admin/cv/${app.id}`}
        download
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00AEEF]/10 border border-[#00AEEF]/20 text-[#00AEEF] rounded-lg text-xs hover:bg-[#00AEEF]/20 transition-colors"
      >
        <FileDown size={13} />
        Download CV — {displayName}
      </a>

      {/* Deletable toggle */}
      <label className="inline-flex items-center  p-2 gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={deletable}
          disabled={togglingDeletable}
          onChange={(e) => toggleDeletable(e.target.checked)}
          className="w-3.5 h-3.5 accent-red-500"
        />
        <span className="text-xs text-gray-500">Allow CV file deletion</span>
      </label>

      {/* Delete CV button — only shown when marked deletable */}
      {deletable && !confirmDelete && (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/8 border border-red-500/25 text-red-400 rounded-lg text-xs hover:bg-red-500/18 transition-all"
        >
          <Trash2 size={12} />
          Delete CV file
        </button>
      )}

      {/* Inline confirmation */}
      {deletable && confirmDelete && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            Delete &ldquo;{displayName}&rdquo; from disk?
          </span>
          <button
            onClick={handleDeleteCv}
            disabled={deletingCv}
            className="px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-400 rounded-md text-xs hover:bg-red-500/25 disabled:opacity-50 transition-all"
          >
            {deletingCv ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            disabled={deletingCv}
            className="px-2.5 py-1 border border-white/10 text-gray-400 rounded-md text-xs hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Single application card ───────────────────────────────────────────────────
function ApplicationCard({
  app,
  applicantName,
  applicantEmail,
  onDeleteClick,
  onCvDeleted,
}: {
  app: ApplicationEntry;
  applicantName: string;
  applicantEmail: string;
  onDeleteClick: () => void;
  onCvDeleted: () => void;
}) {
  const roleLabel = app.job?.title ?? app.role;

  return (
    <div className="border border-white/8 rounded-xl p-4 space-y-3 bg-white/2">
      {/* Role + date header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-white">{roleLabel}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(app.submittedAt).toLocaleString("en-GB", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Europe/Sarajevo",
            })}
          </p>
        </div>
      </div>

      {/* Contact details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {app.phone && (
          <div className="flex items-center gap-1.5 text-gray-300">
            <Phone size={13} className="text-[#00AEEF] shrink-0" />
            {app.phone}
          </div>
        )}
        {app.linkedin && (
          <div className="flex items-center gap-1.5 text-gray-300">
            <LinkedinIcon size={13} className="text-[#00AEEF] shrink-0" />
            <a
              href={app.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00AEEF] transition-colors truncate"
            >
              LinkedIn Profile
            </a>
          </div>
        )}
        {app.portfolio && (
          <div className="flex items-center gap-1.5 text-gray-300">
            <Globe size={13} className="text-[#00AEEF] shrink-0" />
            <a
              href={app.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00AEEF] transition-colors truncate"
            >
              Portfolio
            </a>
          </div>
        )}
      </div>

      {/* Applicant details grid */}
      {(app.currentlyEmployed !== null &&
        app.currentlyEmployed !== undefined) ||
      app.yearsOfExperience ||
      app.location ||
      app.bimSoftware ? (
        <div className="bg-black/20 border border-white/6 rounded-xl p-3.5 space-y-3">
          {/* Employment + experience + location */}
          {((app.currentlyEmployed !== null &&
            app.currentlyEmployed !== undefined) ||
            app.yearsOfExperience ||
            app.location) && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {app.currentlyEmployed !== null &&
                app.currentlyEmployed !== undefined && (
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                      Employment Status
                    </p>
                    <p
                      className={`text-sm font-medium ${app.currentlyEmployed ? "text-amber-400" : "text-[#00FF9C]"}`}
                    >
                      {app.currentlyEmployed
                        ? "Currently employed"
                        : "Available immediately"}
                    </p>
                  </div>
                )}
              {app.currentlyEmployed && app.noticePeriod && (
                <div>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                    Notice Period
                  </p>
                  <p className="text-sm text-gray-200">
                    {NOTICE_LABELS[app.noticePeriod] ?? app.noticePeriod}
                  </p>
                </div>
              )}
              {app.yearsOfExperience && (
                <div>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                    Work Experience
                  </p>
                  <p className="text-sm text-gray-200">
                    {EXPERIENCE_LABELS[app.yearsOfExperience] ??
                      app.yearsOfExperience}
                  </p>
                </div>
              )}
              {app.location && (
                <div>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                    Current Location
                  </p>
                  <p className="text-sm text-gray-200">{app.location}</p>
                </div>
              )}
            </div>
          )}

          {/* Skills / proficiency */}
          {app.bimSoftware && (
            <div>
              {((app.currentlyEmployed !== null &&
                app.currentlyEmployed !== undefined) ||
                app.yearsOfExperience ||
                app.location) && (
                <div className="border-t border-white/6 mb-3" />
              )}
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Skills & Proficiency
              </p>
              <div className="flex flex-wrap gap-1.5">
                {app.bimSoftware
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 rounded-md text-xs bg-[#00AEEF]/10 border border-[#00AEEF]/20 text-[#00AEEF]"
                    >
                      {tool}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* CV section */}
      {app.cvFileName ? (
        <CvSection app={app} onCvDeleted={onCvDeleted} />
      ) : null}

      {/* Cover letter */}
      {app.message && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">
            Cover Letter
          </p>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {app.message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={`mailto:${encodeURIComponent(applicantEmail)}?subject=${encodeURIComponent(`Re: Application for ${roleLabel}`)}`}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00FF9C]/15 to-[#00AEEF]/15 border border-[#00FF9C]/30 text-white rounded-lg text-sm hover:from-[#00FF9C]/25 hover:to-[#00AEEF]/25 transition-all"
        >
          <Reply size={14} />
          Reply via Email
        </a>
        <button
          onClick={onDeleteClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/8 border border-red-500/25 text-red-400 rounded-lg text-xs hover:bg-red-500/18 transition-all ml-auto"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Pagination bar ────────────────────────────────────────────────────────────
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
            <span key={`ellipsis-${i}`} className="px-1 text-gray-600 text-sm">
              …
            </span>
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
          ),
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

    const res = await fetch("/api/admin/applications/export", {
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

    // Trigger file download
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications_export.zip";
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
            <div className="w-10 h-10 rounded-full bg-[#00AEEF]/10 flex items-center justify-center shrink-0">
              <Download size={18} className="text-[#00AEEF]" />
            </div>
            <div>
              <p className="font-semibold text-white">Export Applications</p>
              <p className="text-xs text-gray-500">Generate a ZIP archive (Excel + CVs)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-[#00FF9C] font-medium">Export successful!</p>
            <p className="text-xs text-gray-500">Extract the ZIP to find the Excel file and a <strong>cvs/</strong> folder with all CV files.</p>
          </div>
        ) : (
          <>
            {/* Mode selector */}
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
                      ? "bg-[#00AEEF]/10 border-[#00AEEF]/30 text-[#00AEEF]"
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

            {/* Date range (range mode only) */}
            {mode === "range" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 [color-scheme:dark]"
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

            {/* Password confirmation */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Confirm with your admin password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Your password"
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 pr-10"
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
                    : "bg-[#00AEEF]/10 border border-[#00AEEF]/30 text-[#00AEEF] hover:bg-[#00AEEF]/20"
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
export default function ApplicationsClient() {
  const [result, setResult] = useState<PagedResponse | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMailSetup, setShowMailSetup] = useState(false);

  // Single-application delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    appId: string;
    appName: string;
    appRole: string;
    applicantId: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk CV delete
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  // Export modal
  const [showExport, setShowExport] = useState(false);

  // Stale count
  const [staleCount, setStaleCount] = useState<{ staleApplications: number; staleApplicants: number } | null>(null);

  // Filters
  const [jobFilter, setJobFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [hasScore, setHasScore] = useState(""); // "" | "yes" | "no"
  const [hasCV, setHasCV] = useState(""); // "" | "yes" | "no"
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Real-time notifications
  const [newCount, setNewCount] = useState(0);
  const onNewApplication = useCallback(() => setNewCount((n) => n + 1), []);
  useAdminStream("new_application", onNewApplication);

  const fetchApplications = useCallback(
    async (p = page) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (jobFilter) params.set("jobId", jobFilter);
      if (minScore) params.set("minScore", minScore);
      if (hasScore) params.set("hasScore", hasScore);
      if (hasCV) params.set("hasCV", hasCV);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(p));
      const data: PagedResponse = await fetch(
        `/api/admin/applications?${params.toString()}`,
      ).then((r) => r.json());
      setResult(data);
      setLoading(false);
    },
    [jobFilter, minScore, hasScore, hasCV, dateFrom, dateTo, page],
  );

  useEffect(() => {
    fetch("/api/admin/jobs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => setJobs(Array.isArray(data) ? data : []));
    fetch("/api/admin/applications/stale-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStaleCount(data); });
  }, []);

  const filtersRef = useRef({
    jobFilter,
    minScore,
    hasScore,
    hasCV,
    dateFrom,
    dateTo,
  });
  useEffect(() => {
    const prev = filtersRef.current;
    const filtersChanged =
      prev.jobFilter !== jobFilter ||
      prev.minScore !== minScore ||
      prev.hasScore !== hasScore ||
      prev.hasCV !== hasCV ||
      prev.dateFrom !== dateFrom ||
      prev.dateTo !== dateTo;

    filtersRef.current = {
      jobFilter,
      minScore,
      hasScore,
      hasCV,
      dateFrom,
      dateTo,
    };

    if (filtersChanged) {
      setPage(1);
      fetchApplications(1);
    } else {
      fetchApplications(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobFilter, minScore, hasScore, dateFrom, dateTo, page]);

  function handlePageChange(p: number) {
    setPage(p);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setJobFilter("");
    setMinScore("");
    setHasScore("");
    setHasCV("");
    setDateFrom("");
    setDateTo("");
  }

  function loadNew() {
    setNewCount(0);
    setPage(1);
    setExpandedId(null);
    fetchApplications(1);
  }

  function handleApplicantSaved(
    applicantId: string,
    updated: ApplicantRanking,
  ) {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            data: prev.data.map((a) =>
              a.id === applicantId
                ? {
                    ...a,
                    score: updated.score,
                    comments: updated.comments,
                    fitsRoles: updated.fitsRoles,
                    doesNotFit: updated.doesNotFit,
                  }
                : a,
            ),
          }
        : prev,
    );
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);

    const res = await fetch(`/api/admin/applications/${deleteTarget.appId}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (res.ok) {
      setResult((prev) => {
        if (!prev) return prev;
        const newData = prev.data
          .map((applicant) => ({
            ...applicant,
            applications: applicant.applications.filter(
              (app) => app.id !== deleteTarget.appId,
            ),
          }))
          .filter((applicant) => applicant.applications.length > 0);
        return { ...prev, data: newData, total: prev.total - 1 };
      });
      // Collapse the row if the applicant was removed entirely
      setDeleteTarget(null);
    }
  }

  async function handleBulkDeleteCvs() {
    setBulkDeleting(true);
    const res = await fetch("/api/admin/cv/bulk", { method: "DELETE" });
    setBulkDeleting(false);
    setBulkConfirm(false);
    if (res.ok) {
      // Refresh the current view so deleted CVs disappear
      fetchApplications(page);
    }
  }

  const hasFilters =
    jobFilter || minScore || hasScore || hasCV || dateFrom || dateTo;
  const applicants = result?.data ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Applications</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {result
              ? `${result.total} applicant${result.total !== 1 ? "s" : ""} · showing ${applicants.length}${hasFilters ? " (filtered)" : ""}`
              : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#00AEEF] border border-[#00AEEF]/25 rounded-lg hover:bg-[#00AEEF]/10 transition-colors"
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
      {staleCount && staleCount.staleApplications > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-500/8 border border-amber-500/25 rounded-xl text-sm">
          <div className="flex items-center gap-2 text-amber-400">
            <Clock size={14} className="shrink-0" />
            <span>
              <span className="font-semibold">{staleCount.staleApplications}</span> application{staleCount.staleApplications !== 1 ? "s" : ""} older than 12 months
              {staleCount.staleApplicants > 0 && (
                <> · <span className="font-semibold">{staleCount.staleApplicants}</span> applicant{staleCount.staleApplicants !== 1 ? "s" : ""} eligible for removal</>
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
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00AEEF]/10 border border-[#00AEEF]/30 text-[#00AEEF] rounded-2xl text-sm font-medium hover:bg-[#00AEEF]/20 transition-all animate-pulse"
        >
          <Bell size={15} />
          {newCount} new application{newCount !== 1 ? "s" : ""} received — click
          to load
        </button>
      )}

      {/* Filter bar */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 space-y-3">
        {/* Row 1: job + score dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Job posting
            </label>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 appearance-none"
            >
              <option value="">All jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Min score
            </label>
            <select
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 appearance-none"
            >
              <option value="">Any score</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Score status
            </label>
            <select
              value={hasScore}
              onChange={(e) => setHasScore(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 appearance-none"
            >
              <option value="">All applicants</option>
              <option value="yes">Has score</option>
              <option value="no">No score yet</option>
            </select>
          </div>
        </div>

        {/* Row 1b: CV filter + bulk delete */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">CV file</label>
            <select
              value={hasCV}
              onChange={(e) => setHasCV(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00AEEF]/50 appearance-none"
            >
              <option value="">Any</option>
              <option value="yes">Has CV</option>
              <option value="no">No CV</option>
              <option value="deletable">Selected for deletion</option>
            </select>
          </div>
          <div className="flex items-end">
            {!bulkConfirm ? (
              <button
                type="button"
                onClick={() => setBulkConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/8 border border-red-500/25 text-red-400 rounded-lg text-xs hover:bg-red-500/18 transition-all whitespace-nowrap"
              >
                <Trash2 size={13} />
                Delete all selected CVs
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Delete all CVs marked for deletion?</span>
                <button
                  type="button"
                  onClick={handleBulkDeleteCvs}
                  disabled={bulkDeleting}
                  className="px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-400 rounded-md text-xs hover:bg-red-500/25 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {bulkDeleting ? <><Loader2 size={11} className="animate-spin" />Deleting…</> : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkConfirm(false)}
                  disabled={bulkDeleting}
                  className="px-2.5 py-1 border border-white/10 text-gray-400 rounded-md text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: date range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">From</label>
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

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse h-24"
            />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
          <FileText className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400">
            {hasFilters
              ? "No applications match your filters"
              : "No applications yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {applicants.map((applicant) => {
              const isExpanded = expandedId === applicant.id;
              const appCount = applicant.applications.length;
              const isRepeat = appCount > 1;
              const mostRecent = applicant.applications[0];
              const fullName = `${applicant.firstName} ${applicant.lastName}`;

              return (
                <div
                  key={applicant.id}
                  className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
                >
                  {/* Row header */}
                  <button
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : applicant.id)
                    }
                  >
                    <div className="w-10 h-10 rounded-full bg-[#00AEEF]/15 flex items-center justify-center text-[#00AEEF] font-bold shrink-0">
                      {applicant.firstName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white">{fullName}</p>
                        {isRepeat && (
                          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                            <Users size={10} />
                            {appCount} applications
                          </span>
                        )}
                        {applicant.score !== null &&
                          applicant.score !== undefined && (
                            <span className="flex items-center gap-1 text-xs text-[#00AEEF] bg-[#00AEEF]/10 border border-[#00AEEF]/20 px-1.5 py-0.5 rounded-full">
                              <Star size={9} fill="currentColor" />
                              {applicant.score}/10
                            </span>
                          )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {mostRecent?.job?.title ?? mostRecent?.role ?? "—"}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 shrink-0 hidden sm:block text-right">
                      {mostRecent && (
                        <>
                          <div>
                            {new Date(
                              mostRecent.submittedAt,
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              timeZone: "Europe/Sarajevo",
                            })}
                          </div>
                          <div>
                            {new Date(
                              mostRecent.submittedAt,
                            ).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Europe/Sarajevo",
                            })}
                          </div>
                        </>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="text-gray-400 shrink-0"
                      />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                      {/* Contact info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail size={14} className="text-[#00AEEF] shrink-0" />
                          <a
                            href={`mailto:${applicant.email}`}
                            className="hover:text-[#00AEEF] transition-colors truncate"
                          >
                            {applicant.email}
                          </a>
                        </div>
                        {applicant.phone && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Phone
                              size={14}
                              className="text-[#00AEEF] shrink-0"
                            />
                            {applicant.phone}
                          </div>
                        )}
                      </div>

                      {/* Ranking panel */}
                      <ApplicantPanel
                        applicant={{
                          id: applicant.id,
                          score: applicant.score,
                          comments: applicant.comments,
                          fitsRoles: applicant.fitsRoles,
                          doesNotFit: applicant.doesNotFit,
                          _count: { applications: appCount },
                        }}
                        onSaved={(updated) =>
                          handleApplicantSaved(applicant.id, updated)
                        }
                      />

                      {/* Applications list */}
                      {isRepeat && (
                        <p className="text-xs text-gray-500 uppercase tracking-wider pt-1">
                          All Applications ({appCount})
                        </p>
                      )}
                      <div className="space-y-3">
                        {applicant.applications.map((app) => (
                          <ApplicationCard
                            key={app.id}
                            app={app}
                            applicantName={fullName}
                            applicantEmail={applicant.email}
                            onDeleteClick={() =>
                              setDeleteTarget({
                                appId: app.id,
                                appName: fullName,
                                appRole: app.job?.title ?? app.role,
                                applicantId: applicant.id,
                              })
                            }
                            onCvDeleted={() =>
                              setResult((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      data: prev.data.map((a) =>
                                        a.id === applicant.id
                                          ? {
                                              ...a,
                                              applications: a.applications.map(
                                                (x) =>
                                                  x.id === app.id
                                                    ? {
                                                        ...x,
                                                        cvFileName: null,
                                                        cvDeletable: false,
                                                      }
                                                    : x,
                                              ),
                                            }
                                          : a,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                          />
                        ))}
                      </div>
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

      {showMailSetup && (
        <ThunderbirdSetupModal onClose={() => setShowMailSetup(false)} />
      )}

      {/* Export modal */}
      {showExport && (
        <ExportModal
          onClose={() => {
            setShowExport(false);
            // Refresh stale count and list after a potential delete
            fetch("/api/admin/applications/stale-count")
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => { if (data) setStaleCount(data); });
            fetchApplications(1);
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.appName}
          role={deleteTarget.appRole}
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
