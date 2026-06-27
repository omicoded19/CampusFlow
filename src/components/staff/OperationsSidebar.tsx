import {
  Activity,
  BarChart3,
  Building2,
  CircleUserRound,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  ScrollText,
  Settings,
  Shuffle,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import type { AuthUser } from "../../types/auth";
import CampusFlowLogo from "../brand/CampusFlowLogo";

type OperationsSidebarProps = {
  user: AuthUser;
  mode: "staff" | "admin";
  isLoggingOut: boolean;
  onLogout: () => Promise<void>;
};

const staffItems = [
  { label: "Staff Console", icon: LayoutDashboard, href: "/staff", exact: true },
  { label: "Current Queue", icon: ListChecks, href: "/staff/current" },
  { label: "All Queues", icon: UsersRound, href: "/staff/queues" },
  { label: "History", icon: History, href: "/staff/history" },
  { label: "Transfers", icon: Shuffle, href: "/staff/transfers" },
  { label: "Announcements", icon: Megaphone, href: "/staff/announcements" },
];

const adminItems = [
  { label: "Admin Dashboard", icon: LayoutDashboard, href: "/admin", exact: true },
  { label: "Departments", icon: Building2, href: "/admin/departments" },
  { label: "Services", icon: SlidersHorizontal, href: "/admin/services" },
  { label: "Counters", icon: Activity, href: "/admin/counters" },
  { label: "Staff Management", icon: UsersRound, href: "/admin/staff" },
  { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { label: "System Logs", icon: ScrollText, href: "/admin/logs" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

function OperationsSidebar({ user, mode, isLoggingOut, onLogout }: OperationsSidebarProps) {
  const location = useLocation();
  const items = mode === "admin" ? adminItems : staffItems;
  const homePath = mode === "admin" ? "/admin" : "/staff";

  return (
    <aside className="hidden min-h-screen w-[235px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
      <Link to={homePath} className="px-2">
        <CampusFlowLogo />
      </Link>

      <nav className="mt-9 space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_8px_18px_rgba(91,69,220,0.22)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-4">
        {mode === "staff" && user.role === "ADMIN" && (
          <Link
            to="/admin"
            className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <BarChart3 className="h-[18px] w-[18px]" />
            Admin Portal
          </Link>
        )}

        <Link
          to={mode === "admin" ? "/admin/profile" : "/staff/profile"}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            location.pathname.endsWith("/profile")
              ? "bg-violet-50 text-violet-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <CircleUserRound className="h-[18px] w-[18px]" />
          Profile
        </Link>

        <button
          type="button"
          disabled={isLoggingOut}
          onClick={() => void onLogout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px]" />
          {isLoggingOut ? "Signing out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}

export default OperationsSidebar;
