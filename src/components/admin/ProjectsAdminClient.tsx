"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Pencil, Trash2, FolderKanban, ChevronUp, ChevronDown, Star, MapPin, EyeOff, Loader2 } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type { Project } from "@/types/index";
import { revalidateProjects } from "@/app/actions";
import DeleteModal from "./DeleteModal";

type PendingDelete = { id: string; title: string };

export default function ProjectsAdminClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const [togglingComingSoon, setTogglingComingSoon] = useState(false);

  async function loadProjects() {
    const res = await fetch("/api/admin/projects");
    setProjects(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setComingSoon(data.projectsComingSoon); });
  }, []);

  async function toggleComingSoon(enabled: boolean) {
    setTogglingComingSoon(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectsComingSoon: enabled }),
    });
    setTogglingComingSoon(false);
    if (res.ok) {
      await revalidateProjects();
      setComingSoon(enabled);
      toast.success(enabled ? "Projects page set to \"Coming Soon\"" : "Projects page is now live");
    } else {
      toast.error("Failed to update setting");
    }
  }

  async function confirmDelete(id: string, title: string) {
    const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      await revalidateProjects();
      toast.success(`"${title}" deleted`);
    }
    loadProjects();
  }

  async function move(index: number, direction: "up" | "down") {
    const newProjects = [...projects];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newProjects.length) return;
    [newProjects[index], newProjects[swapIndex]] = [newProjects[swapIndex], newProjects[index]];
    setProjects(newProjects);
    await fetch("/api/admin/projects/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newProjects.map((p) => p.id) }),
    });
    await revalidateProjects();
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in portfolio · drag ↕ to reorder
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/navitecs-control-admin/projects/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            New Project
          </Link>
        </div>
      </div>

      {/* Coming Soon toggle */}
      <div className={`flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border transition-all ${
        comingSoon
          ? "bg-amber-500/8 border-amber-500/30"
          : "bg-white/3 border-white/10"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            comingSoon ? "bg-amber-500/15" : "bg-white/5"
          }`}>
            <EyeOff size={16} className={comingSoon ? "text-amber-400" : "text-gray-500"} />
          </div>
          <div>
            <p className={`text-sm font-medium ${comingSoon ? "text-amber-300" : "text-gray-300"}`}>
              Coming Soon Mode
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {comingSoon
                ? "Projects page is hidden — visitors see a \"Coming Soon\" screen. Project detail pages are inaccessible."
                : "Projects page is live and visible to all visitors."}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={togglingComingSoon}
          onClick={() => toggleComingSoon(!comingSoon)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus:outline-none disabled:opacity-50 ${
            comingSoon ? "bg-amber-500 border-amber-500" : "bg-white/10 border-white/20"
          }`}
          role="switch"
          aria-checked={comingSoon}
        >
          {togglingComingSoon ? (
            <Loader2 size={10} className="absolute left-1/2 -translate-x-1/2 text-white animate-spin" />
          ) : (
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              comingSoon ? "translate-x-5" : "translate-x-0.5"
            }`} />
          )}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
          <FolderKanban className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400 mb-4">No projects yet</p>
          <Link
            href="/navitecs-control-admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg text-sm"
          >
            <Plus size={14} />
            Add First Project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-3 p-4">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => move(index, "up")} disabled={index === 0} className="p-1 rounded hover:bg-white/5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors" title="Move up">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => move(index, "down")} disabled={index === projects.length - 1} className="p-1 rounded hover:bg-white/5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors" title="Move down">
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5">
                  {project.featuredImage ? (
                    <ImageWithFallback src={project.featuredImage} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderKanban size={20} className="text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-semibold text-white truncate">{project.title}</h3>
                    <span className="px-2 py-0.5 text-xs bg-[#00AEEF]/15 text-[#00AEEF] rounded-full border border-[#00AEEF]/20 shrink-0">
                      {project.category}
                    </span>
                    {project.status === "draft" && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/15 text-yellow-400 rounded-full border border-yellow-500/20 shrink-0">
                        Draft
                      </span>
                    )}
                    {project.featured && (
                      <Star size={12} className="text-yellow-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">{project.description}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {project.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin size={10} /> {project.location}
                      </span>
                    )}
                    {project.scopeOfWork.length > 0 && (
                      <span className="text-xs text-gray-600 truncate">
                        {project.scopeOfWork.slice(0, 2).join(" · ")}{project.scopeOfWork.length > 2 ? ` +${project.scopeOfWork.length - 2}` : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/projects/${project.id}`} target="_blank" title="View on site" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white text-xs">
                    ↗
                  </Link>
                  <Link href={`/navitecs-control-admin/projects/${project.id}/edit`} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-[#00AEEF]">
                    <Pencil size={16} />
                  </Link>
                  <button onClick={() => setPendingDelete({ id: project.id, title: project.title })} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-gray-400 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <DeleteModal
          itemName={pendingDelete.title}
          onConfirm={() => confirmDelete(pendingDelete.id, pendingDelete.title)}
          onClose={() => setPendingDelete(null)}
          actionHint={`delete_project:${pendingDelete.id}`}
        />
      )}
    </div>
  );
}
