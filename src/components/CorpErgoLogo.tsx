import logoImg from "@/assets/corpergo-logo.png";
import { cn } from "@/lib/utils";

const sizeClasses = {
  nav: "h-9 w-9",
  xs: "h-9 w-9",
  sm: "h-12 sm:h-14",
  md: "h-16 sm:h-[4.25rem]",
  lg: "h-[4.25rem] sm:h-20 lg:h-[5.5rem]",
  xl: "h-20 sm:h-24 lg:h-28",
} as const;

const padClasses = {
  nav: "p-1",
  xs: "p-0",
  sm: "p-2 sm:p-2.5",
  md: "p-2.5 sm:p-3",
  lg: "p-3 sm:p-4",
  xl: "p-3.5 sm:p-4",
} as const;

/** Light = white E on dark backgrounds; dark = black E on light backgrounds. */
export type CorpErgoLogoETone = "light" | "dark";

type CorpErgoLogoProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
  frameClassName?: string;
  withFrame?: boolean;
  /** When set, the letter E adapts for contrast against the page background. */
  eTone?: CorpErgoLogoETone;
};

function LogoImage({
  size,
  className,
  eTone,
}: {
  size: keyof typeof sizeClasses;
  className?: string;
  eTone?: CorpErgoLogoETone;
}) {
  const usesCover = className?.includes("object-cover");
  const fitClass = usesCover ? "object-cover object-top" : "object-contain";
  const imageClass = cn(sizeClasses[size], "w-auto max-w-none", fitClass, className);

  if (!eTone) {
    return <img src={logoImg} alt="CorpErgo" className={imageClass} decoding="async" />;
  }

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <img src={logoImg} alt="CorpErgo" className={imageClass} decoding="async" />
      <img
        src={logoImg}
        alt=""
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full max-w-none transition-opacity duration-300",
          fitClass,
          eTone === "light" ? "opacity-100 mix-blend-lighten" : "opacity-0",
        )}
        style={{
          filter: "brightness(0) invert(1)",
          clipPath: "inset(4% 0 4% 34%)",
        }}
        decoding="async"
      />
    </span>
  );
}

export function CorpErgoLogo({
  size = "lg",
  className,
  frameClassName,
  withFrame = true,
  eTone,
}: CorpErgoLogoProps) {
  const image = <LogoImage size={size} className={className} eTone={eTone} />;

  if (!withFrame) return image;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/10",
        padClasses[size],
        frameClassName,
      )}
    >
      {image}
    </div>
  );
}

export { logoImg as corpergoLogoUrl };
