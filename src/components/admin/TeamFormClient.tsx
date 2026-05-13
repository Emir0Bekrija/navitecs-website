"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { TeamMember } from "@/types/index";
import ImageUploader from "./ImageUploader";

type Props = { memberId?: string };

const inputClass =
  "w-full px-4 py-3 bg-black border border-white/15 rounded-lg focus:outline-none focus:border-[#00AEEF] transition-colors text-white placeholder-gray-600";
const labelClass = "block text-sm font-medium text-gray-300 mb-2";

export default function TeamFormClient({ memberId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(memberId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    role: "",
    bio: "",
    imageUrl: "",
    featured: false,
    active: true,
  });
  const pendingFile = useRef<File | null>(null);

  function handlePendingFile(_blobUrl: string, file: File) {
    pendingFile.current = file;
  }
  function handleClearPending() {
    pendingFile.current = null;
  }

  useEffect(() => {
    if (!memberId) return;
    fetch(`/api/admin/team/${memberId}`)
      .then((r) => r.json())
      .then((member: TeamMember) => {
        setForm({
          name: member.name,
          role: member.role,
          bio: member.bio ?? "",
          imageUrl: member.imageUrl ?? "",
          featured: member.featured,
          active: member.active,
        });
        setLoading(false);
      });
  }, [memberId]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = { ...form };

    // Upload pending image if there is one
    if (pendingFile.current) {
      const fd = new FormData();
      fd.append("image", pendingFile.current);
      const uploadRes = await fetch("/api/admin/images", { method: "POST", body: fd });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        setError(uploadData.error ?? "Image upload failed");
        setSaving(false);
        return;
      }
      payload.imageUrl = uploadData.url as string;
      if (form.imageUrl.startsWith("blob:")) URL.revokeObjectURL(form.imageUrl);
      pendingFile.current = null;
    }

    const url = isEdit ? `/api/admin/team/${memberId}` : "/api/admin/team";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(isEdit ? "Member saved" : "Member added");
      router.push("/navitecs-control-admin/team");
    } else {
      const data = await res.json();
      setError(data.error || "Save failed");
      setSaving(false);
    }
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
      <div className="flex items-center gap-4">
        <Link
          href="/navitecs-control-admin/team"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back to Team
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold">
          {isEdit ? "Edit Team Member" : "Add Team Member"}
        </h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {isEdit
            ? "Update the member details below"
            : "Fill in the details for the new team member"}
        </p>
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
          label="Photo"
          hint="Square photo works best (will be displayed as a circle)"
        />

        <div>
          <label htmlFor="name" className={labelClass}>
            Full Name *
          </label>
          <input
            id="name"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. John Doe"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="role" className={labelClass}>
            Role / Title *
          </label>
          <input
            id="role"
            name="role"
            required
            value={form.role}
            onChange={handleChange}
            placeholder="e.g. Director, Lead BIM Coordinator"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="bio" className={labelClass}>
            Short Bio{" "}
            <span className="text-gray-600 font-normal">(optional, max 2000 chars)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            maxLength={2000}
            placeholder="A brief description of their expertise and background..."
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-gray-600 mt-1 text-right">
            {form.bio.length}/2000
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="w-4 h-4 accent-[#00AEEF]"
            />
            <label htmlFor="active" className="text-sm text-gray-300">
              Visible on site
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={form.featured}
              onChange={handleChange}
              className="w-4 h-4 accent-amber-400"
            />
            <label htmlFor="featured" className="text-sm text-gray-300">
              Featured on About page
            </label>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Member"}
          </button>
          <Link
            href="/navitecs-control-admin/team"
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
