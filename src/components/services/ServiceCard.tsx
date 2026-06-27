import type { LucideIcon } from "lucide-react";
import { ArrowRight, Clock3, UsersRound } from "lucide-react";
import { Link } from "react-router";

import { getServiceTheme } from "../../lib/service-theme";

type ServiceCardProps = {
  id: string;
  icon: LucideIcon;
  department: string;
  title: string;
  description: string;
  waitTime: number;
  peopleWaiting: number;
  activeCounters: number;
  isOpen: boolean;
};

function ServiceCard({
  id,
  icon: Icon,
  department,
  title,
  description,
  waitTime,
  peopleWaiting,
  activeCounters,
  isOpen,
}: ServiceCardProps) {
  const theme = getServiceTheme(id);

  return (
    <article
      className={`group flex min-h-[248px] flex-col overflow-hidden rounded-[18px] border p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.075)] ${theme.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-white/70 ${theme.icon}`}>
          <Icon className="h-6 w-6" strokeWidth={2.15} />
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${
            isOpen
              ? "bg-emerald-100/90 text-emerald-700"
              : "bg-slate-200/90 text-slate-500"
          }`}
        >
          {isOpen ? "Open" : "Closed"}
        </span>
      </div>

      <p className={`mt-3 text-xs font-bold ${theme.accent}`}>{department}</p>
      <h3 className="mt-1 text-[17px] font-extrabold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-1.5 line-clamp-2 min-h-10 text-[13px] leading-5 text-slate-600">{description}</p>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <UsersRound className="h-4 w-4" />
          <span>People waiting: <strong className="text-slate-950">{peopleWaiting}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Clock3 className="h-4 w-4" />
          <span>Est. wait: <strong className="text-slate-950">{isOpen ? `${waitTime} min` : "—"}</strong></span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        {isOpen ? (
          <Link
            to={`/services/${id}`}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${theme.button}`}
          >
            Join Queue
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-white/65 px-4 py-2.5 text-sm font-semibold text-slate-400"
          >
            Currently Closed
          </button>
        )}
      </div>

      <p className="mt-2 text-center text-[10px] font-semibold text-slate-500">
        {activeCounters} active {activeCounters === 1 ? "counter" : "counters"}
      </p>
    </article>
  );
}

export default ServiceCard;
