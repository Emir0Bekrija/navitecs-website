"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  Building2,
  FolderKanban,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Users,
  MonitorDot,
  ShieldCheck,
  ScrollText,
  Megaphone,
  BarChart2,
  UsersRound,
  Star,
} from "lucide-react";
import AdminNotifications from "@/components/admin/AdminNotifications";

const BASE_NAV = [
  {
    href: "/navitecs-control-admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/navitecs-control-admin/jobs",
    label: "Job Postings",
    icon: Briefcase,
  },
  {
    href: "/navitecs-control-admin/applications",
    label: "Applications",
    icon: FileText,
  },
  {
    href: "/navitecs-control-admin/applicants",
    label: "Applicants",
    icon: Users,
  },
  {
    href: "/navitecs-control-admin/contacts",
    label: "Contacts",
    icon: MessageSquare,
  },
  {
    href: "/navitecs-control-admin/company-contacts",
    label: "Company Contacts",
    icon: Building2,
  },
  {
    href: "/navitecs-control-admin/projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    href: "/navitecs-control-admin/team",
    label: "Team",
    icon: UsersRound,
  },
  {
    href: "/navitecs-control-admin/about-featured",
    label: "Featured on About",
    icon: Star,
  },
  {
    href: "/navitecs-control-admin/popup",
    label: "Popup",
    icon: Megaphone,
  },
  {
    href: "/navitecs-control-admin/statistics",
    label: "Statistics",
    icon: BarChart2,
  },
];

const SUPERADMIN_NAV = [
  {
    href: "/navitecs-control-admin/sessions",
    label: "Sessions",
    icon: MonitorDot,
  },
  { href: "/navitecs-control-admin/users", label: "Users", icon: ShieldCheck },
  {
    href: "/navitecs-control-admin/audit-log",
    label: "Audit Log",
    icon: ScrollText,
  },
];

type Me = { username: string; role: string };

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-[#00AEEF]/15 to-[#00FF9C]/15 text-white border border-[#00AEEF]/30"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon size={18} className={active ? "text-[#00AEEF]" : ""} />
      {label}
      {active && <ChevronRight size={14} className="ml-auto text-[#00AEEF]" />}
    </Link>
  );
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  // Global 401 interceptor — redirect to login when session expires
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await original(...args);
      if (res.status === 401) {
        const url =
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof URL
              ? args[0].toString()
              : "";
        // verify-password returns 401 on wrong password — handled by DeleteModal, not here
        if (!url.includes("/api/auth/login") && !url.includes("/api/admin/verify-password")) {
          router.push("/navitecs-control-admin/login?expired=1");
        }
      }
      return res;
    };
    return () => {
      window.fetch = original;
    };
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => {
        if (r.status === 401) {
          router.push("/navitecs-control-admin/login?expired=1");
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data: Me | null) => {
        if (data) setMe(data);
      })
      .catch(() => {});
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/navitecs-control-admin/login");
  }

  const close = () => setSidebarOpen(false);
  const isSuperAdmin = me?.role === "superadmin";

  const allNavItems = [...BASE_NAV, ...(isSuperAdmin ? SUPERADMIN_NAV : [])];
  const currentPage =
    allNavItems.find((item) => pathname.startsWith(item.href))?.label ??
    "Admin";

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-[#0a0a0a] border-r border-white/10 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00AEEF] to-[#00FF9C] flex items-center justify-center shrink-0">
            <span className="text-black font-bold text-sm">N</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm">NAVITECS</p>
            <p className="text-xs text-gray-500 truncate">
              {me ? me.username : "…"}
            </p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {BASE_NAV.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={pathname.startsWith(item.href)}
              onClick={close}
            />
          ))}

          {isSuperAdmin && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-xs text-gray-600 uppercase tracking-wider">
                  Security
                </p>
              </div>
              {SUPERADMIN_NAV.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  active={pathname.startsWith(item.href)}
                  onClick={close}
                />
              ))}
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span className="text-[#00AEEF]">↗</span>
            View Live Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-6 h-14 border-b border-white/10 bg-[#0a0a0a] shrink-0">
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-semibold text-gray-300">{currentPage}</h1>
          <div className="ml-auto flex items-center gap-3">
            <AdminNotifications />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF9C]" />
              <span className="text-xs text-gray-500">
                {me ? `${me.username} · ${me.role}` : "…"}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
