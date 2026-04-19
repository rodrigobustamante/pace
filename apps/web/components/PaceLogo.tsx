type PaceLogoProps = {
  className?: string;
  /** LCP on landing; optional fetch priority hint */
  priority?: boolean;
};

const INTRINSIC_W = 646;
const INTRINSIC_H = 208;

/**
 * Wordmark from `/public/pace-logo.svg`. Pass a Vanilla Extract class for sizing
 * (header vs hero); intrinsic dimensions preserve aspect ratio and help CLS.
 */
export function PaceLogo({ className, priority }: PaceLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG asset
    <img
      src="/pace-logo.svg"
      alt="PACE"
      width={INTRINSIC_W}
      height={INTRINSIC_H}
      className={className}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
