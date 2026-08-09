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

type CorpErgoLogoProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
  frameClassName?: string;
  withFrame?: boolean;
};

export function CorpErgoLogo({
  size = "lg",
  className,
  frameClassName,
  withFrame = true,
}: CorpErgoLogoProps) {
  const image = (
    <img
      src={logoImg}
      alt="CorpErgo"
      className={cn(sizeClasses[size], "w-auto max-w-none object-contain", className)}
      decoding="async"
    />
  );

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
