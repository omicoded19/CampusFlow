export type ServiceTheme = {
  card: string;
  icon: string;
  button: string;
  accent: string;
};

const themes: ServiceTheme[] = [
  {
    card: "border-violet-200 bg-gradient-to-br from-violet-50 via-violet-50/95 to-indigo-50",
    icon: "bg-violet-200/80 text-violet-700",
    button: "bg-violet-200/90 text-violet-800 hover:bg-violet-300",
    accent: "text-violet-700",
  },
  {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50/95 to-teal-50",
    icon: "bg-emerald-200/85 text-emerald-700",
    button: "bg-emerald-200/90 text-emerald-800 hover:bg-emerald-300",
    accent: "text-emerald-700",
  },
  {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50/95 to-orange-50",
    icon: "bg-amber-200/85 text-amber-700",
    button: "bg-amber-200/90 text-amber-900 hover:bg-amber-300",
    accent: "text-amber-700",
  },
  {
    card: "border-blue-200 bg-gradient-to-br from-blue-50 via-sky-50/95 to-indigo-50",
    icon: "bg-blue-200/85 text-blue-700",
    button: "bg-blue-200/90 text-blue-800 hover:bg-blue-300",
    accent: "text-blue-700",
  },
  {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 via-pink-50/95 to-red-50",
    icon: "bg-rose-200/85 text-rose-700",
    button: "bg-rose-200/90 text-rose-800 hover:bg-rose-300",
    accent: "text-rose-700",
  },
  {
    card: "border-cyan-200 bg-gradient-to-br from-cyan-50 via-teal-50/95 to-sky-50",
    icon: "bg-cyan-200/85 text-cyan-800",
    button: "bg-cyan-200/90 text-cyan-900 hover:bg-cyan-300",
    accent: "text-cyan-800",
  },
];

function hashServiceId(serviceId: string) {
  return Array.from(serviceId).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
}

export function getServiceTheme(serviceId: string) {
  return themes[hashServiceId(serviceId) % themes.length];
}
