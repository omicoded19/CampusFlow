import { Bell, CalendarClock, Home, ListChecks, LogOut, UserRound, UsersRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { logoutUser } from "../../api/auth-api";
import type { AuthUser } from "../../types/auth";
import StudentSidebar from "./StudentSidebar";

type StudentPageShellProps = {
  user: AuthUser;
  eyebrow?: string;
  title: string;
  children: ReactNode;
};

const mobileItems = [
  { label: "Home", path: "/dashboard", icon: Home, exact: true },
  { label: "Services", path: "/services", icon: UsersRound },
  { label: "My Queue", path: "/dashboard/queue", icon: ListChecks },
  { label: "History", path: "/dashboard/history", icon: CalendarClock },
  { label: "Profile", path: "/dashboard/profile", icon: UserRound },
];

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StudentPageShell({ user, eyebrow, title, children }: StudentPageShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      setLogoutError("");
      await logoutUser();
      navigate("/login?role=student", { replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Unable to sign out.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <StudentSidebar user={user} onLogout={handleLogout} isLoggingOut={isLoggingOut} />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4">
            <div>
              {eyebrow && <p className="text-xs font-semibold text-slate-500">{eyebrow}</p>}
              <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/notifications"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
              >
                <Bell className="h-5 w-5" />
              </Link>

              <Link
                to="/dashboard/profile"
                aria-label="Profile"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-violet-200 text-xs font-extrabold text-violet-800 ring-2 ring-white shadow"
              >
                {getInitials(user.fullName)}
              </Link>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 lg:hidden"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          <nav className="mx-auto mt-4 flex max-w-[1380px] gap-2 overflow-x-auto pb-1 lg:hidden">
            {mobileItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                    isActive ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="mx-auto max-w-[1380px] px-5 py-7 sm:px-8">
          {logoutError && (
            <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
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
