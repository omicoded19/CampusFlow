import { Bell, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { logoutUser } from "../../api/auth-api";
import type { AuthUser } from "../../types/auth";
import OperationsSidebar from "./OperationsSidebar";

type OperationsPageShellProps = {
  user: AuthUser;
  mode: "staff" | "admin";
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function OperationsPageShell({
  user,
  mode,
  eyebrow,
  title,
  subtitle,
  children,
  onRefresh,
  isRefreshing = false,
}: OperationsPageShellProps) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logoutUser();
      navigate("/login?role=staff", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <OperationsSidebar
        user={user}
        mode={mode}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="mx-auto flex max-w-[1460px] flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">{eyebrow}</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              )}
              <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-violet-200 text-xs font-extrabold text-violet-800">
                {getInitials(user.fullName)}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1460px] px-5 py-6 sm:px-7">{children}</div>
      </main>
    </div>
  );
}

export default OperationsPageShell;
