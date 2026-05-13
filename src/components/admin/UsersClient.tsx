"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Plus, KeyRound, Eye, EyeOff, X, Check } from "lucide-react";
import DeleteModal from "@/components/admin/DeleteModal";

type AdminUser = {
  id: number;
  username: string;
  role: string;
  createdAt: string;
};

type Me = { id: number; username: string; role: string };

// Password change form state per user
type PwForm = {
  current: string;
  next: string;
  confirm: string;
  showCurrent: boolean;
  showNext: boolean;
  showConfirm: boolean;
  error: string;
  saving: boolean;
};

function defaultPwForm(): PwForm {
  return { current: "", next: "", confirm: "", showCurrent: false, showNext: false, showConfirm: false, error: "", saving: false };
}

export default function UsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const [changingPasswordFor, setChangingPasswordFor] = useState<number | null>(null);
  const [pwForm, setPwForm] = useState<PwForm>(defaultPwForm());

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ username: "", password: "", role: "admin" });
  const [showAddPw, setShowAddPw] = useState(false);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [usersRes, meRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/me"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (meRes.ok) setMe(await meRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function setPwField<K extends keyof PwForm>(key: K, value: PwForm[K]) {
    setPwForm((f) => ({ ...f, [key]: value, error: key !== "error" ? "" : f.error }));
  }

  async function savePassword(userId: number) {
    const { current, next, confirm } = pwForm;
    if (!current) { setPwField("error", "Enter the current password."); return; }
    if (next.length < 12) { setPwField("error", "New password must be at least 12 characters."); return; }
    if (next !== confirm) { setPwField("error", "New passwords do not match."); return; }
    setPwForm((f) => ({ ...f, saving: true, error: "" }));
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({})) as { error?: string };
      setPwForm((f) => ({ ...f, saving: false, error: j.error ?? "Failed to save." }));
    } else {
      setChangingPasswordFor(null);
      setPwForm(defaultPwForm());
    }
  }

  async function addUser() {
    setAddError("");
    if (addForm.username.length < 3) { setAddError("Username must be at least 3 characters."); return; }
    if (!/^[a-z0-9_-]+$/.test(addForm.username)) { setAddError("Username must be lowercase letters, numbers, _ and - only."); return; }
    if (addForm.password.length < 12) { setAddError("Password must be at least 12 characters."); return; }
    setAdding(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    setAdding(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({})) as { error?: unknown };
      if (typeof j.error === "string") {
        setAddError(j.error);
      } else if (j.error && typeof j.error === "object") {
        const flat = j.error as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
        const fieldMsg = flat.fieldErrors?.username?.[0] ?? flat.fieldErrors?.password?.[0];
        setAddError(fieldMsg ?? flat.formErrors?.[0] ?? "Failed to create user.");
      } else {
        setAddError("Failed to create user.");
      }
    } else {
      setShowAddForm(false);
      setAddForm({ username: "", password: "", role: "admin" });
      load();
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Admin Users</h2>
          <p className="text-gray-400 text-sm mt-0.5">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#00FF9C]/10 border border-[#00FF9C]/25 text-[#00FF9C] rounded-lg hover:bg-[#00FF9C]/20 transition-all"
        >
          {showAddForm ? <X size={13} /> : <Plus size={13} />}
          {showAddForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {/* Add user form */}
      {showAddForm && (
        <div className="bg-[#0a0a0a] border border-[#00FF9C]/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#00FF9C]">New Admin User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Username</label>
              <input
                type="text"
                value={addForm.username}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))
                }
                placeholder="e.g. john_doe"
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF9C]/50"
              />
              <p className="text-[11px] text-gray-600 mt-1">Lowercase letters, numbers, _ and - only</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Role</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF9C]/50 appearance-none"
              >
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Password (min 12 chars)</label>
            <div className="relative">
              <input
                type={showAddPw ? "text" : "password"}
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Strong password…"
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF9C]/50"
              />
              <button type="button" onClick={() => setShowAddPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showAddPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <button
            onClick={addUser}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2 bg-[#00FF9C]/10 border border-[#00FF9C]/25 text-[#00FF9C] rounded-lg text-sm hover:bg-[#00FF9C]/20 transition-all disabled:opacity-50"
          >
            <Check size={14} />
            {adding ? "Creating…" : "Create User"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-full bg-[#00AEEF]/15 flex items-center justify-center text-[#00AEEF] shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{user.username}</span>
                    {user.id === me?.id && (
                      <span className="text-xs text-[#00FF9C] bg-[#00FF9C]/10 border border-[#00FF9C]/20 px-1.5 py-0.5 rounded-full">You</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                      user.role === "superadmin"
                        ? "bg-[#00FF9C]/10 border-[#00FF9C]/20 text-[#00FF9C]"
                        : "bg-white/5 border-white/10 text-gray-400"
                    }`}>{user.role}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Created {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Sarajevo" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (changingPasswordFor === user.id) {
                        setChangingPasswordFor(null);
                        setPwForm(defaultPwForm());
                      } else {
                        setChangingPasswordFor(user.id);
                        setPwForm(defaultPwForm());
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
                  >
                    <KeyRound size={12} />
                    Change password
                  </button>
                  {user.id !== me?.id && (
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      {/* Trash icon inline to avoid extra import */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Password change form */}
              {changingPasswordFor === user.id && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                  <p className="text-xs text-gray-500">All sessions for this user will be invalidated on save.</p>

                  {/* Current password */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Current password</label>
                    <div className="relative">
                      <input
                        type={pwForm.showCurrent ? "text" : "password"}
                        value={pwForm.current}
                        onChange={(e) => setPwField("current", e.target.value)}
                        placeholder="Current password…"
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50"
                      />
                      <button type="button" onClick={() => setPwField("showCurrent", !pwForm.showCurrent)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        {pwForm.showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* New password */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">New password (min 12 chars)</label>
                      <div className="relative">
                        <input
                          type={pwForm.showNext ? "text" : "password"}
                          value={pwForm.next}
                          onChange={(e) => setPwField("next", e.target.value)}
                          placeholder="New password…"
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50"
                        />
                        <button type="button" onClick={() => setPwField("showNext", !pwForm.showNext)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                          {pwForm.showNext ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm new password */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Confirm new password</label>
                      <div className="relative">
                        <input
                          type={pwForm.showConfirm ? "text" : "password"}
                          value={pwForm.confirm}
                          onChange={(e) => setPwField("confirm", e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && savePassword(user.id)}
                          placeholder="Repeat new password…"
                          className={`w-full bg-black border rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50 ${
                            pwForm.confirm && pwForm.next && pwForm.confirm !== pwForm.next
                              ? "border-red-500/40"
                              : "border-white/10"
                          }`}
                        />
                        <button type="button" onClick={() => setPwField("showConfirm", !pwForm.showConfirm)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                          {pwForm.showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {pwForm.error && <p className="text-xs text-red-400">{pwForm.error}</p>}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => { setChangingPasswordFor(null); setPwForm(defaultPwForm()); }}
                      className="px-4 py-2 border border-white/10 text-gray-400 rounded-lg text-sm hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => savePassword(user.id)}
                      disabled={pwForm.saving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#00AEEF]/10 border border-[#00AEEF]/25 text-[#00AEEF] rounded-lg text-sm hover:bg-[#00AEEF]/20 transition-all disabled:opacity-50"
                    >
                      <Check size={13} />
                      {pwForm.saving ? "Saving…" : "Save password"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal (with lockout) */}
      {deleteTarget && (
        <DeleteModal
          itemName={deleteTarget.username}
          actionHint={`delete_admin_user:${deleteTarget.id}`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
            load();
          }}
        />
      )}
    </div>
  );
}
