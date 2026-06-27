import {
  Bell,
  CalendarClock,
  CircleHelp,
  Home,
  ListChecks,
  LogOut,
  Settings,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import type { AuthUser } from "../../types/auth";
import CampusFlowLogo from "../brand/CampusFlowLogo";

type StudentSidebarProps = {
  user: AuthUser;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
};

type SidebarItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  exact?: boolean;
};

const sidebarItems: SidebarItem[] = [
  { label: "Home", path: "/dashboard", icon: Home, exact: true },
  { label: "Services", path: "/services", icon: UsersRound },
  { label: "My Queue", path: "/dashboard/queue", icon: ListChecks },
  { label: "History", path: "/dashboard/history", icon: CalendarClock },
  { label: "Notifications", path: "/dashboard/notifications", icon: Bell },
  { label: "Profile", path: "/dashboard/profile", icon: UserRound },
  { label: "Settings", path: "/dashboard/settings", icon: Settings },
];

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StudentSidebar({
  user,
  onLogout,
  isLoggingOut,
}: StudentSidebarProps) {
  const location = useLocation();

  return (
    <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-5 lg:flex">
      <Link to="/dashboard" className="px-2">
        <CampusFlowLogo />
      </Link>

      <nav className="mt-9 space-y-1.5">
        {sidebarItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_8px_18px_rgba(91,69,220,0.24)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}

        <a
          href="mailto:support@campusflow.local"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
        >
          <CircleHelp className="h-[18px] w-[18px]" />
          Help & Support
        </a>
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-extrabold text-violet-700">
            {getInitials(user.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950">{user.fullName}</p>
            <p className="truncate text-[11px] text-slate-500">{user.studentId ?? user.email}</p>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoggingOut}
          onClick={() => void onLogout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px]" />
          {isLoggingOut ? "Signing out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}

export default StudentSidebar;
