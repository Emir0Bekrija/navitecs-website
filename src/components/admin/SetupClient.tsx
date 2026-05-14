"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, User } from "lucide-react";

export default function SetupClient() {
  const router = useRouter();
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/setup/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json() as { ok?: boolean; error?: string };

      if (res.status === 403) {
        setError("A superadmin already exists. Go to the login page and sign in, or run 'npx tsx scripts/seed-superadmin.ts' to reset the password.");
      } else if (!res.ok) {
        setError(data.error ?? "Setup failed.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/navitecs-control-admin/login"), 2500);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,174,239,0.08)_0%,transparent_70%)]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.08)_0%,transparent_70%)]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00AEEF] to-[#00FF9C] flex items-center justify-center mb-4">
            <ShieldCheck className="text-black" size={24} />
          </div>
          <h1 className="text-2xl font-bold">Initial Setup</h1>
          <p className="text-gray-400 text-sm mt-1">Create the superadmin account</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 size={40} className="text-[#00FF9C]" />
              <p className="text-white font-semibold">Superadmin created!</p>
              <p className="text-gray-400 text-sm">Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-xs text-yellow-400">
                This page is only accessible when no admin users exist. It will be disabled after setup.
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-300">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                    placeholder="superadmin"
                    className="w-full px-4 py-3 bg-black border border-white/15 rounded-lg focus:outline-none focus:border-[#00AEEF] transition-colors text-white pl-11"
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
                  Password <span className="text-gray-500 font-normal">(min 12 characters)</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Strong password…"
                    className="w-full px-4 py-3 bg-black border border-white/15 rounded-lg focus:outline-none focus:border-[#00AEEF] transition-colors text-white pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full py-3 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account…" : "Create Superadmin"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          This page is not indexed by search engines
        </p>
      </div>
    </div>
  );
}
