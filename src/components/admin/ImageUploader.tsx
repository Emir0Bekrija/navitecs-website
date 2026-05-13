"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon, Link } from "lucide-react";

type InputMode = "upload" | "url";

type Props = {
  value: string;           // current URL (empty string = none)
  onChange: (url: string) => void;
  /** When true, skip the server upload — preview via blob URL and notify parent via onPendingFile. */
  deferred?: boolean;
  /** Called (deferred mode) when a new file is selected. blobUrl is the local preview URL. */
  onPendingFile?: (blobUrl: string, file: File) => void;
  /** Called (deferred mode) when the current pending image is cleared or replaced. */
  onClearPending?: (blobUrl: string) => void;
  label?: string;
  hint?: string;
  className?: string;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

/** Infer the input mode from a value: blob: and /api/images/ are uploads, everything else is a URL. */
function detectMode(value: string): InputMode {
  if (!value) return "upload";
  if (value.startsWith("blob:") || value.startsWith("/api/images/")) return "upload";
  return "url";
}

export default function ImageUploader({
  value,
  onChange,
  deferred = false,
  onPendingFile,
  onClearPending,
  label,
  hint,
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track which input mode is active (upload or url)
  const [mode, setMode] = useState<InputMode>(() => detectMode(value));
  // Local draft for the URL text input (committed to parent only on blur / Enter)
  const [urlDraft, setUrlDraft] = useState(() => (detectMode(value) === "url" ? value : ""));

  // Keep mode + urlDraft in sync when value changes externally (e.g. edit form loads)
  useEffect(() => {
    if (!value) return;
    const detected = detectMode(value);
    setMode(detected);
    if (detected === "url") setUrlDraft(value);
  }, [value]);

  // ── Mode switching ──────────────────────────────────────────────────────────

  function switchMode(next: InputMode) {
    if (next === mode) return;
    // Clear any current value when switching — both modes are mutually exclusive
    if (value) {
      if (deferred && value.startsWith("blob:")) {
        onClearPending?.(value);
        URL.revokeObjectURL(value);
      }
      onChange("");
    }
    setUrlDraft("");
    setError(null);
    setMode(next);
  }

  // ── Upload handlers ─────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are accepted");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image too large (max 10 MB)");
      return;
    }

    if (deferred) {
      if (value && value.startsWith("blob:")) {
        onClearPending?.(value);
        URL.revokeObjectURL(value);
      }
      const blobUrl = URL.createObjectURL(file);
      onChange(blobUrl);
      onPendingFile?.(blobUrl, file);
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/admin/images", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
    onChange(data.url as string);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // allow re-selecting same file
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── URL handlers ────────────────────────────────────────────────────────────

  function commitUrl(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) { onChange(""); setError(null); return; }
    try {
      new URL(trimmed);
      onChange(trimmed);
      setError(null);
    } catch {
      setError("Please enter a valid image URL");
    }
  }

  // ── Clear ───────────────────────────────────────────────────────────────────

  function clear() {
    if (deferred && value && value.startsWith("blob:")) {
      onClearPending?.(value);
      URL.revokeObjectURL(value);
    }
    onChange("");
    setUrlDraft("");
    setError(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const hasUpload = mode === "upload" && Boolean(value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <p className="block text-sm font-medium text-gray-300">{label}</p>}
      {hint  && <p className="text-xs text-gray-500">{hint}</p>}

      {/* ── Mode toggle ───────────────────────────────────────────────────── */}
      <div className="flex rounded-lg border border-white/10 overflow-hidden w-fit text-xs">
        <button
          type="button"
          onClick={() => switchMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors border-r border-white/10 ${
            mode === "upload"
              ? "bg-[#00AEEF]/15 text-[#00AEEF]"
              : "bg-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Upload size={11} /> Upload
        </button>
        <button
          type="button"
          onClick={() => switchMode("url")}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors ${
            mode === "url"
              ? "bg-[#00AEEF]/15 text-[#00AEEF]"
              : "bg-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Link size={11} /> URL
        </button>
      </div>

      {/* ── Upload panel ──────────────────────────────────────────────────── */}
      {mode === "upload" && (
        <>
          {hasUpload ? (
            /* Preview with Replace / Remove overlay */
            <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Preview" className="w-full max-h-48 object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur border border-white/20 text-white rounded-lg text-xs hover:bg-white/20 transition-colors"
                >
                  <Upload size={12} /> Replace
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 backdrop-blur border border-red-500/30 text-red-300 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                >
                  <X size={12} /> Remove
                </button>
              </div>
            </div>
          ) : (
            /* Drop zone */
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !uploading && inputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 w-full py-8 border border-dashed rounded-xl transition-colors cursor-pointer ${
                uploading
                  ? "border-[#00AEEF]/40 bg-[#00AEEF]/5 cursor-wait"
                  : "border-white/15 bg-white/2 hover:border-[#00AEEF]/50 hover:bg-[#00AEEF]/5"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 size={22} className="text-[#00AEEF] animate-spin" />
                  <span className="text-xs text-gray-400">Uploading…</span>
                </>
              ) : (
                <>
                  <ImageIcon size={22} className="text-gray-600" />
                  <div className="text-center">
                    <p className="text-sm text-gray-400">
                      Drop image here or <span className="text-[#00AEEF]">click to browse</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">JPEG, PNG, WebP · max 10 MB</p>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Show the stored path for reference (not for blob preview URLs) */}
          {hasUpload && !value.startsWith("blob:") && (
            <p className="text-xs text-gray-600 truncate font-mono">{value}</p>
          )}
        </>
      )}

      {/* ── URL panel ─────────────────────────────────────────────────────── */}
      {mode === "url" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlDraft}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 bg-black border border-white/15 rounded-lg focus:outline-none focus:border-[#00AEEF] transition-colors text-white placeholder-gray-600 text-sm"
              onChange={(e) => setUrlDraft(e.target.value)}
              onBlur={(e) => commitUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitUrl((e.target as HTMLInputElement).value);
                }
              }}
            />
            {value && (
              <button
                type="button"
                onClick={clear}
                className="p-3 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Preview once URL is committed */}
          {value && (
            <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="URL preview" className="w-full max-h-48 object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInput}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
