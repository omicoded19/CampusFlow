import {
  BadgeCheck,
  Building2,
  CircleHelp,
  CreditCard,
  FileCheck2,
  LibraryBig,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

const serviceIcons: Record<string, LucideIcon> = {
  "file-check": FileCheck2,
  stethoscope: Stethoscope,
  library: LibraryBig,
  "credit-card": CreditCard,
  building: Building2,
  "badge-check": BadgeCheck,
};

export function getServiceIcon(iconKey: string): LucideIcon {
  return serviceIcons[iconKey] ?? CircleHelp;
}