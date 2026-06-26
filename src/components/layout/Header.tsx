import {
  Link,
  useLocation,
} from "react-router";

import CampusFlowLogo from "../brand/CampusFlowLogo";

function Header() {
  const location = useLocation();

  const isHomePage =
    location.pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e7ef] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          to="/"
          aria-label="Go to CampusFlow home"
          className="shrink-0 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
        >
          <CampusFlowLogo showTagline />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 md:flex"
        >
          <Link
            to="/#services"
            className="text-sm font-semibold text-slate-600 transition hover:text-violet-700"
          >
            Services
          </Link>

          <Link
            to="/#how-it-works"
            className="text-sm font-semibold text-slate-600 transition hover:text-violet-700"
          >
            How it works
          </Link>

          <Link
            to="/#help"
            className="text-sm font-semibold text-slate-600 transition hover:text-violet-700"
          >
            Help
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login?role=staff"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-violet-700 sm:inline-flex"
          >
            Staff Login
          </Link>

          <Link
            to="/login?role=student"
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 sm:px-5"
          >
            Student Login
          </Link>
        </div>
      </div>

      {!isHomePage && (
        <div className="h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
      )}
    </header>
  );
}

export default Header;