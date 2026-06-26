import {
  BadgeCheck,
  Building2,
  CircleHelp,
  CreditCard,
  FileCheck2,
  LibraryBig,
  Stethoscope,
  type LucideProps,
} from "lucide-react";

type ServiceIconProps = LucideProps & {
  iconKey: string;
};

function ServiceIcon({
  iconKey,
  ...iconProps
}: ServiceIconProps) {
  switch (iconKey) {
    case "file-check":
      return <FileCheck2 {...iconProps} />;

    case "stethoscope":
      return <Stethoscope {...iconProps} />;

    case "library":
      return <LibraryBig {...iconProps} />;

    case "credit-card":
      return <CreditCard {...iconProps} />;

    case "building":
      return <Building2 {...iconProps} />;

    case "badge-check":
      return <BadgeCheck {...iconProps} />;

    default:
      return <CircleHelp {...iconProps} />;
  }
}

export default ServiceIcon;