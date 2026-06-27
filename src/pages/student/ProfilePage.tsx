import {
  BadgeCheck,
  Mail,
  UserRound,
} from "lucide-react";

import StudentPageShell from "../../components/dashboard/StudentPageShell";
import type { AuthUser } from "../../types/auth";

type ProfilePageProps = {
  user: AuthUser;
};

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProfilePage({ user }: ProfilePageProps) {
  return (
    <StudentPageShell
      user={user}
      eyebrow="Student Portal"
      title="Profile"
    >
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-3xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 text-2xl font-bold text-violet-700">
            {getInitials(user.fullName)}
          </div>
          <h2 className="mt-5 text-2xl font-bold text-gray-950">
            {user.fullName}
          </h2>
          <p className="mt-1 text-gray-500">
            {user.email}
          </p>
          <span className="mt-5 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            Verified student account
          </span>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-950">
            Account information
          </h2>
          <div className="mt-6 divide-y divide-gray-100">
            <div className="flex items-start gap-4 py-5 first:pt-0">
              <UserRound className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Full name
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {user.fullName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 py-5">
              <Mail className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  College email
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 py-5 pb-0">
              <BadgeCheck className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Student ID
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {user.studentId ?? "Not available"}
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </StudentPageShell>
  );
}

export default ProfilePage;
