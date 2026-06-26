type CampusFlowLogoProps = {
  showTagline?: boolean;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

function CampusFlowLogo({
  showTagline = false,
  compact = false,
  inverse = false,
  className = "",
}: CampusFlowLogoProps) {
  return (
    <div
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label="CampusFlow"
    >
      <img
        src="/campusflow-logo.svg"
        alt=""
        aria-hidden="true"
        className={`shrink-0 ${
          compact
            ? "h-9 w-9"
            : "h-11 w-11"
        }`}
      />

      {!compact && (
        <div className="min-w-0">
          <span
            className={`block text-[18px] font-extrabold tracking-[-0.035em] ${
              inverse
                ? "text-white"
                : "text-slate-950"
            }`}
          >
            CampusFlow
          </span>

          {showTagline && (
            <span
              className={`mt-1 block text-xs font-medium ${
                inverse
                  ? "text-violet-100"
                  : "text-slate-500"
              }`}
            >
              Campus services, simplified
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default CampusFlowLogo;