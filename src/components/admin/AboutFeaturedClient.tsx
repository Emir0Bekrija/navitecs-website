"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import ImageUploader from "./ImageUploader";

const inputClass =
  "w-full px-4 py-3 bg-black border border-white/15 rounded-lg focus:outline-none focus:border-[#00AEEF] transition-colors text-white placeholder-gray-600";
const labelClass = "block text-sm font-medium text-gray-300 mb-2";

export default function AboutFeaturedClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "Our Team",
    text: "",
    imageUrl: "",
    enabled: true,
  });
  const pendingFile = useRef<File | null>(null);

  function handlePendingFile(_blobUrl: string, file: File) {
    pendingFile.current = file;
  }
  function handleClearPending() {
    pendingFile.current = null;
  }

  useEffect(() => {
    fetch("/api/admin/about-featured")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setForm({
            title: data.title || "Our Team",
            text: data.text || "",
            imageUrl: data.imageUrl || "",
            enabled: data.enabled ?? true,
          });
        }
        setLoading(false);
      });
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = { ...form };

    // Upload pending image if there is one
    if (pendingFile.current) {
      const fd = new FormData();
      fd.append("image", pendingFile.current);
      const uploadRes = await fetch("/api/admin/images", {
        method: "POST",
        body: fd,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        toast.error(uploadData.error ?? "Image upload failed");
        setSaving(false);
        return;
      }
      payload.imageUrl = uploadData.url as string;
      if (form.imageUrl.startsWith("blob:")) URL.revokeObjectURL(form.imageUrl);
      pendingFile.current = null;
    }

    const res = await fetch("/api/admin/about-featured", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Saved");
    } else {
      const data = await res.json();
      toast.error(data.error ? "Validation error" : "Save failed");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#00AEEF]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Featured on About Page</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Manage the team highlight section shown on the About page. One image
            (right) and text (left).
          </p>
        </div>
      </div>
      <div>
        <button
          type="button"
          onClick={() =>
            setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
          }
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            form.enabled
              ? "border-[#00FF9C]/30 bg-[#00FF9C]/10 text-[#00FF9C]"
              : "border-white/10 bg-white/5 text-gray-400"
          }`}
        >
          {form.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {form.enabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-5"
      >
        <ImageUploader
          value={form.imageUrl}
          onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
          deferred
          onPendingFile={handlePendingFile}
          onClearPending={handleClearPending}
          label="Featured Image"
          hint="This image will be shown without any border or box — edit it creatively before uploading"
        />

        <div>
          <label htmlFor="title" className={labelClass}>
            Section Title
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Our Team"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="text" className={labelClass}>
            Text{" "}
            <span className="text-gray-600 font-normal">
              (shown on the left side)
            </span>
          </label>
          <textarea
            id="text"
            name="text"
            value={form.text}
            onChange={handleChange}
            rows={6}
            maxLength={5000}
            placeholder="Describe your team, the key people, what drives them..."
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-gray-600 mt-1 text-right">
            {form.text.length}/5000
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
