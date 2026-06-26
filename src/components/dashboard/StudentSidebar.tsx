import {
  Bell,
  CalendarClock,
  Home,
  LogOut,
  Settings,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  Link,
  useLocation,
} from "react-router";

import type { AuthUser } from "../../types/auth";

type StudentSidebarProps = {
  user: AuthUser;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
};

type SidebarItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "Campus Services",
    path: "/#services",
    icon: UsersRound,
  },
  {
    label: "Queue History",
    path: "/dashboard/history",
    icon: CalendarClock,
  },
  {
    label: "Notifications",
    path: "/dashboard/notifications",
    icon: Bell,
  },
  {
    label: "Profile",
    path: "/dashboard/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    path: "/dashboard/settings",
    icon: Settings,
  },
];

function SidebarIcon({
  icon: Icon,
}: {
  icon: LucideIcon;
}) {
  return <Icon className="h-5 w-5" />;
}

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
    <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white px-5 py-6 lg:flex">
      <Link
        to="/"
        className="flex items-center gap-3 px-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 font-bold text-white">
          CF
        </div>

        <div>
          <p className="text-lg font-bold text-gray-950">
            CampusFlow
          </p>

          <p className="text-xs text-gray-500">
            Smart campus queues
          </p>
        </div>
      </Link>

      <nav className="mt-10 space-y-2">
        {sidebarItems.map((item) => {
          const isActive =
            location.pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
              }`}
            >
              <SidebarIcon icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
              {getInitials(user.fullName)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-950">
                {user.fullName}
              </p>

              <p className="truncate text-xs text-gray-500">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-500">
            Student ID:{" "}
            <span className="font-semibold text-gray-800">
              {user.studentId ?? "Not available"}
            </span>
          </div>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => {
              void onLogout();
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />

            {isLoggingOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default StudentSidebar;