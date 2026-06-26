import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";

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
  return (
    <article className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isOpen
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {isOpen ? "Open" : "Closed"}
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-violet-600">{department}</p>

      <h3 className="mt-1 text-xl font-bold text-gray-900">{title}</h3>

      <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">
        {description}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4">
        <div>
          <p className="text-lg font-bold text-gray-900">
            {isOpen ? `${waitTime}m` : "—"}
          </p>
          <p className="text-xs text-gray-500">Wait time</p>
        </div>

        <div>
          <p className="text-lg font-bold text-gray-900">{peopleWaiting}</p>
          <p className="text-xs text-gray-500">Waiting</p>
        </div>

        <div>
          <p className="text-lg font-bold text-gray-900">{activeCounters}</p>
          <p className="text-xs text-gray-500">Counters</p>
        </div>
      </div>

      {isOpen ? (
        <Link
          to={`/services/${id}`}
          className="mt-5 block w-full rounded-xl bg-violet-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          View Queue
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-5 w-full cursor-not-allowed rounded-xl bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-500"
        >
          Currently Closed
        </button>
      )}
    </article>
  );
}

export default ServiceCard;