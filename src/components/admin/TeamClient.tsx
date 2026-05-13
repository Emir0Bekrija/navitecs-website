"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  Users,
  Star,
} from "lucide-react";
import type { TeamMember } from "@/types/index";
import DeleteModal from "./DeleteModal";
import { ImageWithFallback } from "../figma/ImageWithFallback";

type PendingDelete = { id: string; name: string };

export default function TeamClient() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  async function loadMembers() {
    const res = await fetch("/api/admin/team");
    setMembers(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadMembers(); }, []);

  async function toggleActive(member: TeamMember) {
    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !member.active }),
    });
    if (res.ok) toast.success(member.active ? "Member hidden" : "Member visible");
    loadMembers();
  }

  async function toggleFeatured(member: TeamMember) {
    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !member.featured }),
    });
    if (res.ok) toast.success(member.featured ? "Removed from featured" : "Added to featured");
    loadMembers();
  }

  async function confirmDelete(id: string, name: string) {
    const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
    if (res.ok) toast.success(`"${name}" deleted`);
    loadMembers();
  }

  async function move(index: number, direction: "up" | "down") {
    const newMembers = [...members];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newMembers.length) return;
    [newMembers[index], newMembers[swapIndex]] = [newMembers[swapIndex], newMembers[index]];
    setMembers(newMembers);
    await fetch("/api/admin/team/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newMembers.map((m) => m.id) }),
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {members.filter((m) => m.active).length} active ·{" "}
            {members.filter((m) => m.featured).length} featured ·{" "}
            {members.length} total
          </p>
        </div>
        <Link
          href="/navitecs-control-admin/team/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Member
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
          <Users className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400 mb-4">No team members yet</p>
          <Link
            href="/navitecs-control-admin/team/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg text-sm"
          >
            <Plus size={14} />
            Add First Member
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member, index) => (
            <div
              key={member.id}
              className={`bg-[#0a0a0a] border rounded-2xl p-5 transition-all ${
                member.active ? "border-white/10" : "border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => move(index, "up")}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-white/5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => move(index, "down")}
                    disabled={index === members.length - 1}
                    className="p-1 rounded hover:bg-white/5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Photo */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 shrink-0">
                  {member.imageUrl ? (
                    <ImageWithFallback
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Users size={20} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-semibold text-white">{member.name}</h3>
                    {member.active ? (
                      <span className="px-2 py-0.5 text-xs bg-[#00FF9C]/15 text-[#00FF9C] rounded-full border border-[#00FF9C]/20">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-white/5 text-gray-500 rounded-full border border-white/10">
                        Hidden
                      </span>
                    )}
                    {member.featured && (
                      <span className="px-2 py-0.5 text-xs bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/25 flex items-center gap-1">
                        <Star size={10} />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{member.role}</p>
                  {member.bio && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{member.bio}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleFeatured(member)}
                    title={member.featured ? "Remove from About page" : "Show on About page"}
                    className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${
                      member.featured ? "text-amber-400" : "text-gray-600 hover:text-amber-400"
                    }`}
                  >
                    <Star size={16} />
                  </button>
                  <button
                    onClick={() => toggleActive(member)}
                    title={member.active ? "Hide" : "Show"}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                  >
                    {member.active ? (
                      <ToggleRight size={20} className="text-[#00FF9C]" />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                  </button>
                  <Link
                    href={`/navitecs-control-admin/team/${member.id}/edit`}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-[#00AEEF]"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    onClick={() => setPendingDelete({ id: member.id, name: member.name })}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-gray-400 hover:text-red-400"
                  >
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
          itemName={pendingDelete.name}
          onConfirm={() => confirmDelete(pendingDelete.id, pendingDelete.name)}
          onClose={() => setPendingDelete(null)}
          actionHint={`delete_team_member:${pendingDelete.id}`}
        />
      )}
    </div>
  );
}
