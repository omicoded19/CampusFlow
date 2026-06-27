import {
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import StudentPageShell from "../../components/dashboard/StudentPageShell";
import type { AuthUser } from "../../types/auth";

type SettingsPageProps = {
  user: AuthUser;
};

function SettingsPage({
  user,
}: SettingsPageProps) {
  return (
    <StudentPageShell
      user={user}
      eyebrow="Student Portal"
      title="Settings"
    >
      <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-950">
          Account security
        </h2>
        <p className="mt-2 max-w-2xl text-gray-600">
          CampusFlow keeps the authentication token
          in a secure HTTP-only cookie and restricts
          student routes to signed-in accounts.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-gray-200 p-5">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <h3 className="mt-4 font-bold text-gray-950">
              Active protected session
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Signed in as {user.email}. Use the
              sign-out button in the sidebar to end
              this session.
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 p-5">
            <LockKeyhole className="h-6 w-6 text-violet-600" />
            <h3 className="mt-4 font-bold text-gray-950">
              Role-based access
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Your current role is {user.role}. Staff
              queue controls are kept separate from
              the student portal.
            </p>
          </article>
        </div>
      </section>
    </StudentPageShell>
  );
}

export default SettingsPage;
