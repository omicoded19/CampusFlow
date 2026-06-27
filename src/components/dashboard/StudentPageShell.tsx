import {
  Bell,
  CalendarClock,
  Home,
  LogOut,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";
import {
  useState,
  type ReactNode,
} from "react";

import { logoutUser } from "../../api/auth-api";
import type { AuthUser } from "../../types/auth";
import StudentSidebar from "./StudentSidebar";

type StudentPageShellProps = {
  user: AuthUser;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

const mobileItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "Services",
    path: "/services",
    icon: UsersRound,
  },
  {
    label: "History",
    path: "/dashboard/history",
    icon: CalendarClock,
  },
  {
    label: "Profile",
    path: "/dashboard/profile",
    icon: UserRound,
  },
];

function StudentPageShell({
  user,
  eyebrow,
  title,
  children,
}: StudentPageShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);
  const [logoutError, setLogoutError] =
    useState("");

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      setLogoutError("");
      await logoutUser();
      navigate("/login?role=student", {
        replace: true,
      });
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7fb]">
      <StudentSidebar
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="min-w-0 flex-1">
        <header className="border-b border-gray-200 bg-white px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-xl font-bold text-gray-950 sm:text-2xl">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/dashboard/notifications"
                aria-label="Notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-600" />
              </Link>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => {
                  void handleLogout();
                }}
                className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 lg:hidden"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          <nav className="mx-auto mt-4 flex max-w-7xl gap-2 overflow-x-auto pb-1 lg:hidden">
            {mobileItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/dashboard"
                  ? location.pathname === item.path
                  : location.pathname.startsWith(
                      item.path,
                    );

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-violet-50 text-violet-700"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          {logoutError && (
            <p
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              {logoutError}
            </p>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}

export default StudentPageShell;
