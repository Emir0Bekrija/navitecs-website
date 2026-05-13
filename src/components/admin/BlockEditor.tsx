"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Trash2, Plus, GripVertical, ChevronRight, Lock } from "lucide-react";
import ImageUploader from "./ImageUploader";
import {
  CONTENT_BLOCK_TYPES,
  FIXED_BLOCK_TYPES,
  BLOCK_TYPE_LABELS,
  createBlock,
  blockSummary,
  type ContentBlock,
  type ContentBlockType,
} from "@/lib/blocks";

const ADDABLE_BLOCK_TYPES = CONTENT_BLOCK_TYPES.filter(
  (t) => !(FIXED_BLOCK_TYPES as readonly string[]).includes(t)
);

// ── Styling helpers ────────────────────────────────────────────────────────────

const inputClass = "w-full px-3 py-2 bg-black border border-white/15 rounded-lg focus:outline-none focus:border-[#00AEEF] transition-colors text-white placeholder-gray-600 text-sm";
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5";

// ── Deferred-upload props shared by editors that contain an ImageUploader ─────

type DeferredProps = {
  deferred?: boolean;
  onPendingFile?: (blobUrl: string, file: File) => void;
  onClearPending?: (blobUrl: string) => void;
};

// ── Per-block type editors ─────────────────────────────────────────────────────

function TextEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div>
      <label className={labelClass}>Content</label>
      <textarea
        value={String(data.content ?? "")}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
        rows={6}
        placeholder="Enter text content…"
        className={`${inputClass} resize-y`}
      />
    </div>
  );
}

function ImageEditor({ data, onChange, deferred, onPendingFile, onClearPending }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void } & DeferredProps) {
  return (
    <div className="space-y-3">
      <ImageUploader
        label="Image *"
        value={String(data.url ?? "")}
        onChange={(url) => onChange({ ...data, url })}
        deferred={deferred}
        onPendingFile={onPendingFile}
        onClearPending={onClearPending}
      />
      <div>
        <label className={labelClass}>Caption</label>
        <input className={inputClass} value={String(data.caption ?? "")} onChange={(e) => onChange({ ...data, caption: e.target.value })} placeholder="Optional caption…" />
      </div>
      <div>
        <label className={labelClass}>Alt text</label>
        <input className={inputClass} value={String(data.alt ?? "")} onChange={(e) => onChange({ ...data, alt: e.target.value })} placeholder="Descriptive alt text…" />
      </div>
    </div>
  );
}

function GalleryEditor({ data, onChange, deferred, onPendingFile, onClearPending }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void } & DeferredProps) {
  const images = (data.images as { url: string; caption?: string }[]) ?? [];

  function setImageUrl(idx: number, url: string) {
    const next = images.map((img, i) => (i === idx ? { ...img, url } : img));
    onChange({ ...data, images: next });
  }
  function setCaption(idx: number, caption: string) {
    const next = images.map((img, i) => (i === idx ? { ...img, caption } : img));
    onChange({ ...data, images: next });
  }
  function addImage() { onChange({ ...data, images: [...images, { url: "" }] }); }
  function removeImage(idx: number) { onChange({ ...data, images: images.filter((_, i) => i !== idx) }); }

  return (
    <div className="space-y-4">
      {images.map((img, idx) => (
        <div key={idx} className="border border-white/8 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Image {idx + 1}</span>
            <button type="button" onClick={() => removeImage(idx)} className="p-1 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
          <ImageUploader
            value={img.url}
            onChange={(url) => setImageUrl(idx, url)}
            deferred={deferred}
            onPendingFile={onPendingFile}
            onClearPending={onClearPending}
          />
          <input className={inputClass} value={img.caption ?? ""} onChange={(e) => setCaption(idx, e.target.value)} placeholder="Caption (optional)" />
        </div>
      ))}
      <button type="button" onClick={addImage} className="flex items-center gap-1.5 text-xs text-[#00AEEF] hover:text-[#00FF9C] transition-colors">
        <Plus size={13} /> Add image
      </button>
    </div>
  );
}

function NoDataEditor({ message }: { message: string }) {
  return <p className="text-xs text-gray-500 italic">{message}</p>;
}

function OverrideListEditor({
  data, onChange, field, placeholder, hint,
}: {
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
  field: string;
  placeholder: string;
  hint: string;
}) {
  const items = (data[field] as string[]) ?? [];
  function setItem(idx: number, val: string) {
    const next = [...items]; next[idx] = val; onChange({ ...data, [field]: next });
  }
  function addItem() { onChange({ ...data, [field]: [...items, ""] }); }
  function removeItem(idx: number) { onChange({ ...data, [field]: items.filter((_, i) => i !== idx) }); }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">{hint}</p>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <input className={`${inputClass} flex-1`} value={item} onChange={(e) => setItem(idx, e.target.value)} placeholder={`${placeholder} ${idx + 1}`} />
          <button type="button" onClick={() => removeItem(idx)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs text-[#00AEEF] hover:text-[#00FF9C] transition-colors">
        <Plus size={13} /> Add item
      </button>
    </div>
  );
}

function ChallengeEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div>
      <label className={labelClass}>Override challenge text (leave empty to use project challenge)</label>
      <textarea className={`${inputClass} resize-y`} rows={4} value={String(data.content ?? "")} onChange={(e) => onChange({ ...data, content: e.target.value })} placeholder="Enter custom challenge text…" />
    </div>
  );
}

function SolutionEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div>
      <label className={labelClass}>Override solution text (leave empty to use project solution)</label>
      <textarea className={`${inputClass} resize-y`} rows={4} value={String(data.content ?? "")} onChange={(e) => onChange({ ...data, content: e.target.value })} placeholder="Enter custom solution text…" />
    </div>
  );
}

function BimEmbedEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Embed URL *</label>
        <input className={inputClass} value={String(data.url ?? "")} onChange={(e) => onChange({ ...data, url: e.target.value })} placeholder="https://…" />
      </div>
      <div>
        <label className={labelClass}>Title</label>
        <input className={inputClass} value={String(data.title ?? "")} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="3D BIM Model…" />
      </div>
      <div>
        <label className={labelClass}>Height (px)</label>
        <input className={inputClass} type="number" value={Number(data.height ?? 500)} onChange={(e) => onChange({ ...data, height: Number(e.target.value) })} min={200} max={1200} />
      </div>
    </div>
  );
}

function VideoEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Video URL * (YouTube, Vimeo, or direct MP4)</label>
        <input className={inputClass} value={String(data.url ?? "")} onChange={(e) => onChange({ ...data, url: e.target.value })} placeholder="https://youtube.com/watch?v=…" />
      </div>
      <div>
        <label className={labelClass}>Title</label>
        <input className={inputClass} value={String(data.title ?? "")} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="Video title…" />
      </div>
    </div>
  );
}

function useImageDims(url: string) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (!url) { setDims(null); return; }
    const img = new window.Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setDims(null);
    img.src = url;
  }, [url]);
  return dims;
}

// Aspect ratio mismatch threshold: warn if ratios differ by more than 15%
const AR_THRESHOLD = 0.15;

function BeforeAfterEditor({ data, onChange, deferred, onPendingFile, onClearPending }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void } & DeferredProps) {
  const beforeUrl = String(data.beforeUrl ?? "");
  const afterUrl  = String(data.afterUrl  ?? "");

  const beforeDims = useImageDims(beforeUrl);
  const afterDims  = useImageDims(afterUrl);

  const mismatch = (() => {
    if (!beforeDims || !afterDims) return false;
    const arBefore = beforeDims.w / beforeDims.h;
    const arAfter  = afterDims.w  / afterDims.h;
    return Math.abs(arBefore - arAfter) / Math.max(arBefore, arAfter) > AR_THRESHOLD;
  })();

  return (
    <div className="space-y-3">
      {mismatch && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>
            Aspect ratios differ significantly (
            {beforeDims!.w}×{beforeDims!.h} vs {afterDims!.w}×{afterDims!.h}).
            For best results, use images with the same or very similar aspect ratio.
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div>
            <label className={labelClass}>Before — Label</label>
            <input className={inputClass} value={String(data.beforeLabel ?? "Before")} onChange={(e) => onChange({ ...data, beforeLabel: e.target.value })} />
          </div>
          <ImageUploader
            label="Before — Image"
            value={beforeUrl}
            onChange={(url) => onChange({ ...data, beforeUrl: url })}
            deferred={deferred}
            onPendingFile={onPendingFile}
            onClearPending={onClearPending}
          />
          {beforeDims && (
            <p className="text-[10px] text-gray-600">{beforeDims.w} × {beforeDims.h} px</p>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <label className={labelClass}>After — Label</label>
            <input className={inputClass} value={String(data.afterLabel ?? "After")} onChange={(e) => onChange({ ...data, afterLabel: e.target.value })} />
          </div>
          <ImageUploader
            label="After — Image"
            value={afterUrl}
            onChange={(url) => onChange({ ...data, afterUrl: url })}
            deferred={deferred}
            onPendingFile={onPendingFile}
            onClearPending={onClearPending}
          />
          {afterDims && (
            <p className="text-[10px] text-gray-600">{afterDims.w} × {afterDims.h} px</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CtaEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Heading *</label>
        <input className={inputClass} value={String(data.heading ?? "")} onChange={(e) => onChange({ ...data, heading: e.target.value })} placeholder="Ready to start your project?" />
      </div>
      <div>
        <label className={labelClass}>Subtext</label>
        <textarea className={`${inputClass} resize-none`} rows={2} value={String(data.subtext ?? "")} onChange={(e) => onChange({ ...data, subtext: e.target.value })} placeholder="Supporting text…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Button Text</label>
          <input className={inputClass} value={String(data.buttonText ?? "")} onChange={(e) => onChange({ ...data, buttonText: e.target.value })} placeholder="Contact Us" />
        </div>
        <div>
          <label className={labelClass}>Button Link</label>
          <input className={inputClass} value={String(data.buttonHref ?? "")} onChange={(e) => onChange({ ...data, buttonHref: e.target.value })} placeholder="/contact" />
        </div>
      </div>
    </div>
  );
}

// ── Block type icon colour ──────────────────────────────────────────────────────

const BLOCK_COLORS: Partial<Record<ContentBlockType, string>> = {
  "value-delivered": "#a78bfa",
  cta:               "#f59e0b",
  "bim-embed":       "#818cf8",
  video:             "#fb7185",
  "before-after":    "#34d399",
};

function blockColor(type: ContentBlockType): string {
  return BLOCK_COLORS[type] ?? "#6b7280";
}

// ── BlockEditor component ──────────────────────────────────────────────────────

type Props = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  deferred?: boolean;
  onPendingFile?: (blobUrl: string, file: File) => void;
  onClearPending?: (blobUrl: string) => void;
};

export default function BlockEditor({ blocks, onChange, deferred, onPendingFile, onClearPending }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTypePicker) return;
    function handleMouseDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowTypePicker(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showTypePicker]);

  function addBlock(type: ContentBlockType) {
    const order = blocks.length;
    const newBlock = createBlock(type, order);
    onChange([...blocks, newBlock]);
    setExpandedId(newBlock.id);
    setShowTypePicker(false);
  }

  function removeBlock(id: string) {
    const next = blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i }));
    onChange(next);
    if (expandedId === id) setExpandedId(null);
  }

  function moveBlock(id: string, direction: "up" | "down") {
    const sorted = [...blocks].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    onChange(sorted.map((b, i) => ({ ...b, order: i })));
  }

  function updateBlockData(id: string, data: Record<string, unknown>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
  }

  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  function renderEditor(block: ContentBlock) {
    const props = { data: block.data, onChange: (d: Record<string, unknown>) => updateBlockData(block.id, d) };
    const imgProps = { deferred, onPendingFile, onClearPending };
    switch (block.type) {
      case "text":          return <TextEditor {...props} />;
      case "image":         return <ImageEditor {...props} {...imgProps} />;
      case "gallery":       return <GalleryEditor {...props} {...imgProps} />;
      case "value-delivered": return <OverrideListEditor {...props} field="items" placeholder="Value" hint="Leave empty to use the project's value delivered list." />;
      case "bim-embed":     return <BimEmbedEditor {...props} />;
      case "video":         return <VideoEditor {...props} />;
      case "before-after":  return <BeforeAfterEditor {...props} {...imgProps} />;
      case "cta":           return <CtaEditor {...props} />;
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {sorted.map((block, idx) => {
          const isFixed = (FIXED_BLOCK_TYPES as readonly string[]).includes(block.type);
          const isExpanded = expandedId === block.id;
          const color = blockColor(block.type);
          return (
            <div key={block.id} className={`border rounded-xl overflow-hidden ${isFixed ? "bg-white/2 border-white/8" : "bg-black border-white/10"}`}>
              {/* Block header */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <GripVertical size={14} className="text-gray-600 shrink-0" />
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />

                <div className={`flex-1 min-w-0 ${!isFixed ? "cursor-pointer" : ""}`} onClick={() => !isFixed && setExpandedId(isExpanded ? null : block.id)}>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-white">{BLOCK_TYPE_LABELS[block.type]}</p>
                    {isFixed && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-white/5 border border-white/10 rounded text-gray-500">
                        <Lock size={8} /> fixed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{blockSummary(block)}</p>
                </div>

                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button type="button" disabled={idx === 0} onClick={() => moveBlock(block.id, "up")} className="p-0.5 hover:text-white text-gray-600 disabled:opacity-20 transition-colors">
                    <ChevronUp size={12} />
                  </button>
                  <button type="button" disabled={idx === sorted.length - 1} onClick={() => moveBlock(block.id, "down")} className="p-0.5 hover:text-white text-gray-600 disabled:opacity-20 transition-colors">
                    <ChevronDown size={12} />
                  </button>
                </div>

                {isFixed ? (
                  <span className="w-6 shrink-0" />
                ) : (
                  <>
                    <button type="button" onClick={() => setExpandedId(isExpanded ? null : block.id)} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors shrink-0">
                      <ChevronRight size={13} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <button type="button" onClick={() => removeBlock(block.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>

              {/* Inline editor — only for non-fixed blocks */}
              {!isFixed && isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
                  {renderEditor(block)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add block */}
      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setShowTypePicker(!showTypePicker)}
          className="flex items-center gap-2 text-sm text-[#00AEEF] hover:text-[#00FF9C] transition-colors"
        >
          <Plus size={15} />
          Add block
        </button>

        {showTypePicker && (
          <div className="absolute left-0 top-7 z-40 bg-[#0d0d0d] border border-white/15 rounded-xl shadow-2xl p-2 grid grid-cols-2 gap-1 w-72">
            {ADDABLE_BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors group"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: blockColor(type) }} />
                <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                  {BLOCK_TYPE_LABELS[type]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
