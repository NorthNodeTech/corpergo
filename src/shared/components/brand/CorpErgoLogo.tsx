import logoImg from "@/assets/corpergo-logo.webp";
import logoWhiteImg from "@/assets/corpergo-logo-white.webp";
import { cn } from "@/lib/core/utils";

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

/** `dark` = white logo for dark backgrounds; `light` = default logo for light backgrounds. */
export type CorpErgoLogoBackground = "light" | "dark";

type CorpErgoLogoProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
  frameClassName?: string;
  withFrame?: boolean;
  background?: CorpErgoLogoBackground;
};

function LogoImage({
  size,
  className,
  background = "light",
}: {
  size: keyof typeof sizeClasses;
  className?: string;
  background?: CorpErgoLogoBackground;
}) {
  const imageClass = cn(
    sizeClasses[size],
    "w-auto max-w-none object-contain object-center",
    className,
  );

  if (background === "dark") {
    return (
      <img
        src={logoWhiteImg}
        alt="CorpErgo Physiotherapy logo"
        className={imageClass}
        decoding="async"
        width={256}
        height={256}
      />
    );
  }

  return (
    <img
      src={logoImg}
      alt="CorpErgo Physiotherapy logo"
      className={imageClass}
      decoding="async"
      width={256}
      height={256}
    />
  );
}

export function CorpErgoLogo({
  size = "lg",
  className,
  frameClassName,
  withFrame = false,
  background = "light",
}: CorpErgoLogoProps) {
  const image = <LogoImage size={size} className={className} background={background} />;

  if (!withFrame) return image;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-transparent",
        padClasses[size],
        frameClassName,
      )}
    >
      {image}
    </div>
  );
}
