"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { revalidateCareers } from "@/app/actions";
import type { Job } from "@/types/index";

type Props = { jobId?: string };

const inputClass =
  "w-full px-4 py-3 bg-black border border-white/15 rounded-lg focus:outline-none focus:border-[#00AEEF] transition-colors text-white placeholder-gray-600";
const labelClass = "block text-sm font-medium text-gray-300 mb-2";

export default function JobFormClient({ jobId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(jobId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    summary: "",
    department: "",
    location: "",
    type: "Full-time",
    description: "",
    active: true,
    isGeneral: false,
    requirements: [""] as string[],
  });

  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/admin/jobs/${jobId}`)
      .then((r) => r.json())
      .then((job: Job) => {
        setForm({
          title: job.title,
          summary: job.summary,
          department: job.department,
          location: job.location,
          type: job.type,
          description: job.description,
          active: job.active,
          isGeneral: job.isGeneral ?? false,
          requirements: job.requirements && job.requirements.length > 0 ? job.requirements : [""],
        });
        setLoading(false);
      });
  }, [jobId]);

  function setRequirement(idx: number, value: string) {
    setForm((prev) => {
      const requirements = [...prev.requirements];
      requirements[idx] = value;
      return { ...prev, requirements };
    });
  }

  function addRequirement() {
    setForm((prev) => ({ ...prev, requirements: [...prev.requirements, ""] }));
  }

  function removeRequirement(idx: number) {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== idx),
    }));
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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

    const url = isEdit ? `/api/admin/jobs/${jobId}` : "/api/admin/jobs";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...form,
      requirements: form.requirements.filter((r) => r.trim()),
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await revalidateCareers();
      toast.success(isEdit ? "Job saved" : "Job created");
      router.push("/navitecs-control-admin/jobs");
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
          href="/navitecs-control-admin/jobs"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back to Jobs
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold">
          {isEdit ? "Edit Job Posting" : "New Job Posting"}
        </h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {isEdit
            ? "Update the job details below"
            : "Fill in the details for the new position"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-5"
      >
        <div>
          <label htmlFor="title" className={labelClass}>
            Job Title *
          </label>
          <input
            id="title"
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Senior BIM Consultant"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="summary" className={labelClass}>
            Short Summary *{" "}
            <span className="text-gray-600 font-normal">(shown on careers list, max 500 chars)</span>
          </label>
          <textarea
            id="summary"
            name="summary"
            required
            value={form.summary}
            onChange={handleChange}
            rows={2}
            maxLength={500}
            placeholder="One or two sentences describing the role at a glance…"
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-gray-600 mt-1 text-right">
            {form.summary.length}/500
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="department" className={labelClass}>
              Department *
            </label>
            <input
              id="department"
              name="department"
              required
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. BIM Consulting"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="location" className={labelClass}>
              Location *
            </label>
            <input
              id="location"
              name="location"
              required
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Remote / Hybrid"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="type" className={labelClass}>
            Employment Type *
          </label>
          <select
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="Full-time" className="bg-[#111]">Full-time</option>
            <option value="Part-time" className="bg-[#111]">Part-time</option>
            <option value="Contract" className="bg-[#111]">Contract</option>
            <option value="Internship" className="bg-[#111]">Internship</option>
            <option value="Freelance" className="bg-[#111]">Freelance</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Full Job Description *{" "}
            <span className="text-gray-600 font-normal">(shown on apply page)</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            value={form.description}
            onChange={handleChange}
            rows={8}
            placeholder="Full details: responsibilities, requirements, what we offer…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>
            Skills & Requirements
            <span className="ml-2 text-gray-600 font-normal">(optional — shown as selectable options on the apply form)</span>
          </label>
          <div className="space-y-2">
            {form.requirements.map((req, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={req}
                  onChange={(e) => setRequirement(idx, e.target.value)}
                  placeholder={`e.g. Revit, Project Management, Python…`}
                  className={`${inputClass} flex-1`}
                />
                {form.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(idx)}
                    className="p-3 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRequirement}
              className="flex items-center gap-2 text-sm text-[#00AEEF] hover:text-[#00FF9C] transition-colors mt-2"
            >
              <Plus size={14} />
              Add requirement
            </button>
          </div>
        </div>

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
            Publish this job (visible to applicants)
          </label>
        </div>

        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <input
            type="checkbox"
            id="isGeneral"
            name="isGeneral"
            checked={form.isGeneral}
            onChange={handleChange}
            className="w-4 h-4 accent-amber-400 mt-0.5 shrink-0"
          />
          <label htmlFor="isGeneral" className="text-sm text-gray-300 cursor-pointer">
            <span className="font-medium text-amber-300">General Application</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Hidden from the open positions list. Linked to the &ldquo;Don&apos;t See Your Role?&rdquo; button on the careers page.
            </span>
          </label>
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Job"}
          </button>
          <Link
            href="/navitecs-control-admin/jobs"
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
