import type { ReactNode } from "react";
import {
  BellRing,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router";

import CampusFlowLogo from "../brand/CampusFlowLogo";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const benefits = [
  {
    icon: Clock3,
    title: "Save time",
    description:
      "Join campus queues remotely before reaching the office.",
  },
  {
    icon: BellRing,
    title: "Receive live updates",
    description:
      "Know when your token is approaching without waiting nearby.",
  },
  {
    icon: ShieldCheck,
    title: "Secure student access",
    description:
      "Your account and queue information remain protected.",
  },
];

function AuthLayout({
  title,
  description,
  children,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-violet-600 to-violet-800 px-12 py-10 text-white lg:flex lg:flex-col">
          <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl" />

          <Link
            to="/"
            className="relative z-10 w-fit rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-white/30"
          >
            <CampusFlowLogo
              showTagline
              inverse
            />
          </Link>

          <div className="relative z-10 my-auto max-w-lg">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-100">
              Smart campus queues
            </span>

            <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-[-0.04em] xl:text-5xl">
              Spend less time waiting and more time
              moving.
            </h2>

            <p className="mt-5 max-w-md text-base leading-7 text-violet-100">
              Access campus services, track live
              queues and receive updates from one
              organised platform.
            </p>

            <div className="mt-10 space-y-5">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-bold">
                        {benefit.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-violet-100">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="relative z-10 text-xs text-violet-200">
            CampusFlow · Campus services,
            simplified
          </p>
        </section>

        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-14 xl:px-20">
          <div className="lg:hidden">
            <Link
              to="/"
              className="inline-flex rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
            >
              <CampusFlowLogo showTagline />
            </Link>
          </div>

          <div className="my-auto w-full max-w-[510px] self-center py-10">
            <div className="rounded-[28px] border border-[#e5e7ef] bg-white p-6 shadow-[0_20px_60px_rgba(36,31,72,0.08)] sm:p-9">
              <div className="mb-8">
                <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-violet-700">
                  CampusFlow account
                </span>

                <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-slate-950">
                  {title}
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>

              {children}
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 lg:text-left">
            Secure access for students and campus
            staff.
          </p>
        </section>
      </div>
    </main>
  );
}

export default AuthLayout;