"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, X, ExternalLink } from "lucide-react";
import { revalidateProjects } from "@/app/actions";
import BlockEditor from "./BlockEditor";
import ImageUploader from "./ImageUploader";
import type { Project, MediaItem } from "@/types/index";
import { createBlock, FIXED_BLOCK_TYPES, type ContentBlock } from "@/lib/blocks";

type Props = { projectId?: string };

// ── Styling ────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 bg-black border border-white/15 rounded-lg focus:outline-none focus:border-[#00AEEF] transition-colors text-white placeholder-gray-600 text-sm";
const labelClass = "block text-sm font-medium text-gray-300 mb-2";
const sectionClass = "bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-5";
const sectionTitle = "text-sm font-semibold text-gray-400 uppercase tracking-wider";

const CATEGORIES = ["Residential", "Commercial", "Industrial", "Healthcare", "Infrastructure", "MEP"];

// ── Multi-string input helper ──────────────────────────────────────────────────

function MultiStringInput({
  label, hint, placeholder, items, onChange, addLabel,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel?: string;
}) {
  function setItem(idx: number, value: string) {
    const next = [...items]; next[idx] = value; onChange(next);
  }
  function removeItem(idx: number) { onChange(items.filter((_, i) => i !== idx)); }
  function addItem() { onChange([...items, ""]); }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => setItem(idx, e.target.value)}
              placeholder={`${placeholder} ${idx + 1}`}
              className={`${inputClass} flex-1`}
            />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(idx)} className="p-3 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm text-[#00AEEF] hover:text-[#00FF9C] transition-colors mt-1">
          <Plus size={14} />
          {addLabel ?? "Add item"}
        </button>
      </div>
    </div>
  );
}

// ── Form state ─────────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  category: string;
  location: string;
  projectSize: string;
  timeline: string;
  numberOfUnits: string;
  clientType: string;
  description: string;
  featuredImage: string;
  scopeOfWork: string[];
  toolsAndTech: string[];
  challenge: string;
  solution: string;
  results: string[];
  valueDelivered: string[];
  media: MediaItem[];
  contentBlocks: ContentBlock[];
  status: "draft" | "published";
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
};

function withMandatoryBlocks(blocks: ContentBlock[]): ContentBlock[] {
  const existing = new Set(blocks.map((b) => b.type));
  const missing = FIXED_BLOCK_TYPES.filter((t) => !existing.has(t));
  if (!missing.length) return blocks;
  const maxOrder = blocks.length ? Math.max(...blocks.map((b) => b.order)) : -1;
  const added = missing.map((t, i) => createBlock(t, maxOrder + i + 1));
  return [...blocks, ...added];
}

const EMPTY_FORM: FormState = {
  title: "",
  category: "Residential",
  location: "",
  projectSize: "",
  timeline: "",
  numberOfUnits: "",
  clientType: "",
  description: "",
  featuredImage: "",
  scopeOfWork: [""],
  toolsAndTech: [""],
  challenge: "",
  solution: "",
  results: [""],
  valueDelivered: [""],
  media: [],
  contentBlocks: withMandatoryBlocks([]),
  status: "published",
  featured: false,
  seoTitle: "",
  seoDescription: "",
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProjectFormClient({ projectId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(projectId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // For the "new project" flow: collect pending File objects keyed by their blob URL.
  // Images are only uploaded to the server when "Create Project" is clicked.
  const pendingFiles = useRef(new Map<string, File>());

  function handlePendingFile(blobUrl: string, file: File) {
    pendingFiles.current.set(blobUrl, file);
  }
  function handleClearPending(blobUrl: string) {
    pendingFiles.current.delete(blobUrl);
  }

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/admin/projects/${projectId}`)
      .then((r) => r.json())
      .then((p: Project) => {
        const blocks = Array.isArray(p.contentBlocks) ? p.contentBlocks : [];
        setForm({
          title:          p.title,
          category:       p.category,
          location:       p.location ?? "",
          projectSize:    p.projectSize ?? "",
          timeline:       p.timeline ?? "",
          numberOfUnits:  p.numberOfUnits ?? "",
          clientType:     p.clientType ?? "",
          description:    p.description,
          featuredImage:  p.featuredImage ?? "",
          scopeOfWork:    Array.isArray(p.scopeOfWork) && p.scopeOfWork.length ? p.scopeOfWork : [""],
          toolsAndTech:   Array.isArray(p.toolsAndTech) && p.toolsAndTech.length ? p.toolsAndTech : [""],
          challenge:      p.challenge ?? "",
          solution:       p.solution ?? "",
          results:        Array.isArray(p.results) && p.results.length ? p.results : [""],
          valueDelivered: Array.isArray(p.valueDelivered) && p.valueDelivered.length ? p.valueDelivered : [""],
          media:          Array.isArray(p.media) ? p.media : [],
          contentBlocks:  withMandatoryBlocks(blocks),
          status:         p.status ?? "published",
          featured:       p.featured ?? false,
          seoTitle:       p.seoTitle ?? "",
          seoDescription: p.seoDescription ?? "",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load project:", err);
        setError("Failed to load project data");
        setLoading(false);
      });
  }, [projectId]);

  function field(name: keyof FormState) {
    return {
      value: form[name] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [name]: e.target.value })),
    };
  }

  function setList(name: "scopeOfWork" | "toolsAndTech" | "results" | "valueDelivered") {
    return (items: string[]) => setForm((prev) => ({ ...prev, [name]: items }));
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      title:          form.title,
      category:       form.category,
      location:       form.location,
      projectSize:    form.projectSize,
      timeline:       form.timeline,
      numberOfUnits:  form.numberOfUnits,
      clientType:     form.clientType,
      description:    form.description,
      featuredImage:  form.featuredImage,
      scopeOfWork:    form.scopeOfWork.filter((s) => s.trim()),
      toolsAndTech:   form.toolsAndTech.filter((s) => s.trim()),
      challenge:      form.challenge,
      solution:       form.solution,
      results:        form.results.filter((s) => s.trim()),
      valueDelivered: form.valueDelivered.filter((s) => s.trim()),
      media:          form.media.filter((m) => m.url.trim()),
      contentBlocks:  form.contentBlocks,
      status:         form.status,
      featured:       form.featured,
      seoTitle:       form.seoTitle,
      seoDescription: form.seoDescription,
    };

    // ── Upload all pending images now, then replace blob URLs ──
    if (pendingFiles.current.size > 0) {
      const urlReplacements = new Map<string, string>();

      for (const [blobUrl, file] of pendingFiles.current.entries()) {
        const fd = new FormData();
        fd.append("image", file);
        const uploadRes = await fetch("/api/admin/images", { method: "POST", body: fd });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Image upload failed");
          setSaving(false);
          return; // leave blob URLs intact so the user can retry
        }
        urlReplacements.set(blobUrl, uploadData.url as string);
      }

      // Replace blob URLs in payload fields
      if (payload.featuredImage && urlReplacements.has(payload.featuredImage)) {
        payload.featuredImage = urlReplacements.get(payload.featuredImage)!;
      }
      payload.media = payload.media.map((m) => ({
        ...m,
        url: urlReplacements.get(m.url) ?? m.url,
      }));
      payload.contentBlocks = replaceBlobUrlsInBlocks(
        payload.contentBlocks,
        urlReplacements,
      );

      // All uploads succeeded — clean up
      for (const blobUrl of urlReplacements.keys()) {
        URL.revokeObjectURL(blobUrl);
      }
      pendingFiles.current.clear();
    }

    const url    = isEdit ? `/api/admin/projects/${projectId}` : "/api/admin/projects";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await revalidateProjects();
      toast.success(projectId ? "Project saved" : "Project created");
      router.push("/navitecs-control-admin/projects");
    } else {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Save failed");
      setSaving(false);
    }
  }

  // ── Helper: replace blob:// URLs inside content blocks ──────────────────────

  function replaceBlobUrlsInBlocks(
    blocks: typeof form.contentBlocks,
    replacements: Map<string, string>,
  ): typeof form.contentBlocks {
    return blocks.map((block) => ({
      ...block,
      data: replaceBlobUrlsInData(block.data, replacements),
    }));
  }

  function replaceBlobUrlsInData(
    data: Record<string, unknown>,
    replacements: Map<string, string>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string" && replacements.has(value)) {
        result[key] = replacements.get(value)!;
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          item !== null && typeof item === "object"
            ? replaceBlobUrlsInData(item as Record<string, unknown>, replacements)
            : item,
        );
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#00AEEF]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/navitecs-control-admin/projects" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} />
          Back to Projects
        </Link>
        {isEdit && (
          <Link href={`/projects/${projectId}`} target="_blank" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#00AEEF] transition-colors ml-auto">
            <ExternalLink size={13} />
            View on site
          </Link>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold">{isEdit ? "Edit Project" : "New Project"}</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {isEdit ? "Update this project case study" : "Add a new project to the portfolio"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Section: Project Info ─────────────────────────────────────────── */}
        <div className={sectionClass}>
          <h3 className={sectionTitle}>Project Info</h3>

          <div>
            <label htmlFor="title" className={labelClass}>Title *</label>
            <input id="title" name="title" required placeholder="e.g. Residential Complex Ilidža" className={inputClass} {...field("title")} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="category" className={labelClass}>Category *</label>
              <select id="category" name="category" className={inputClass} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#111]">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="location" className={labelClass}>Location</label>
              <input id="location" placeholder="e.g. Ilidža, Sarajevo" className={inputClass} {...field("location")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label htmlFor="projectSize" className={labelClass}>Project Size</label>
              <input id="projectSize" placeholder="e.g. 12,000 m²" className={inputClass} {...field("projectSize")} />
            </div>
            <div>
              <label htmlFor="timeline" className={labelClass}>Timeline</label>
              <input id="timeline" placeholder="e.g. 2023–2024 or 8 months" className={inputClass} {...field("timeline")} />
            </div>
            <div>
              <label htmlFor="numberOfUnits" className={labelClass}>Number of Units</label>
              <input id="numberOfUnits" placeholder="e.g. 120 apartments" className={inputClass} {...field("numberOfUnits")} />
            </div>
          </div>

          <div>
            <label htmlFor="clientType" className={labelClass}>Client Type</label>
            <input id="clientType" placeholder="e.g. Developer, Contractor, Architect" className={inputClass} {...field("clientType")} />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>Short Description *</label>
            <textarea id="description" required rows={3} placeholder="Brief project overview for listings and the hero section…" className={`${inputClass} resize-none`} {...field("description")} />
          </div>

          <ImageUploader
            label="Featured Image"
            hint="Used as the hero image on the project page and thumbnail in the listing."
            value={form.featuredImage}
            onChange={(url) => setForm((p) => ({ ...p, featuredImage: url }))}
            deferred
            onPendingFile={handlePendingFile}
            onClearPending={handleClearPending}
          />
        </div>

        {/* ── Section: Status & Visibility ──────────────────────────────────── */}
        <div className={sectionClass}>
          <h3 className={sectionTitle}>Status & Visibility</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "draft" | "published" }))}
                className={inputClass}
              >
                <option value="published" className="bg-[#111]">Published</option>
                <option value="draft" className="bg-[#111]">Draft (not visible on site)</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                className="w-4 h-4 accent-[#00AEEF]"
              />
              <label htmlFor="featured" className="text-sm text-gray-300 cursor-pointer">
                Featured project <span className="text-gray-500">(shown with badge on listing)</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Section: Scope of Work ──────────────────────────────────────────── */}
        <div className={sectionClass}>
          <h3 className={sectionTitle}>Scope of Work</h3>
          <MultiStringInput
            label="Add each service delivered on this project"
            placeholder="Scope item"
            items={form.scopeOfWork}
            onChange={setList("scopeOfWork")}
            addLabel="Add scope item"
          />
        </div>

        {/* ── Section: Tools & Technologies ────────────────────────────────── */}
        <div className={sectionClass}>
          <h3 className={sectionTitle}>Tools & Technologies</h3>
          <MultiStringInput
            label="Software and tools used on this project"
            placeholder="Tool"
            items={form.toolsAndTech}
            onChange={setList("toolsAndTech")}
            addLabel="Add tool"
          />
        </div>

        {/* ── Section: Case Study ──────────────────────────────────────────── */}
        <div className={sectionClass}>
          <h3 className={sectionTitle}>Case Study</h3>

          <div>
            <label htmlFor="challenge" className={labelClass}>The Challenge</label>
            <textarea id="challenge" rows={4} placeholder="What was the main challenge of this project?" className={`${inputClass} resize-none`} {...field("challenge")} />
          </div>

          <div>
            <label htmlFor="solution" className={labelClass}>The Solution</label>
            <textarea id="solution" rows={4} placeholder="How did NAVITECS solve this challenge?" className={`${inputClass} resize-none`} {...field("solution")} />
          </div>

          <MultiStringInput
            label="Results"
            hint="Each result appears as a card with a checkmark icon."
            placeholder="Result"
            items={form.results}
            onChange={setList("results")}
            addLabel="Add result"
          />

          <MultiStringInput
            label="Value Delivered"
            hint="High-level business outcomes. Shown in a separate section."
            placeholder="Value"
            items={form.valueDelivered}
            onChange={setList("valueDelivered")}
            addLabel="Add value item"
          />
        </div>

        {/* ── Section: Content Blocks ───────────────────────────────────────── */}
        <div className={sectionClass}>
          <h3 className={sectionTitle}>Page Layout — Content Blocks</h3>
          <p className="text-xs text-gray-500 mb-1">
            Build a custom page layout by adding and ordering content blocks. Blocks are rendered in order on the project detail page.
            If no blocks are added, the default case study layout (challenge → solution → results → value delivered) is used.
          </p>
          <BlockEditor
            blocks={form.contentBlocks}
            onChange={(blocks) => setForm((prev) => ({ ...prev, contentBlocks: blocks }))}
            deferred
            onPendingFile={handlePendingFile}
            onClearPending={handleClearPending}
          />
        </div>

        {/* ── Section: SEO ─────────────────────────────────────────────────── */}
        <div className={sectionClass}>
          <h3 className={sectionTitle}>SEO</h3>
          <div>
            <label htmlFor="seoTitle" className={labelClass}>SEO Title</label>
            <input id="seoTitle" placeholder={form.title || "Project title"} className={inputClass} {...field("seoTitle")} />
            <p className="text-xs text-gray-600 mt-1">Leave empty to use the project title.</p>
          </div>
          <div>
            <label htmlFor="seoDescription" className={labelClass}>SEO Description</label>
            <textarea id="seoDescription" rows={3} placeholder={(form.description ?? "").slice(0, 160) || "Project description…"} className={`${inputClass} resize-none`} {...field("seoDescription")} />
            <p className="text-xs text-gray-600 mt-1">Leave empty to use the short description (first 160 chars).</p>
          </div>
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* ── Save / Cancel ─────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Project"}
          </button>
          <Link
            href="/navitecs-control-admin/projects"
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  );
}
