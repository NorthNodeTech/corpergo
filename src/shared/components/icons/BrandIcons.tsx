import type { SimpleIcon } from "simple-icons";
import {
  siFacebook,
  siInstagram,
  siYoutube,
} from "simple-icons";
import gmailLogo from "@/assets/icons/gmail-logo.webp";
import googleMapsLogo from "@/assets/icons/google-maps-logo.webp";
import googlePhoneLogo from "@/assets/icons/google-phone-logo.webp";
import { cn } from "@/lib/core/utils";

type BrandIconProps = {
  className?: string;
  title?: string;
};

function SimpleBrandIcon({
  icon,
  className,
  title,
}: BrandIconProps & { icon: SimpleIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path fill={`#${icon.hex}`} d={icon.path} />
    </svg>
  );
}

function BrandImageIcon({
  src,
  className,
  title,
}: BrandIconProps & { src: string }) {
  return (
    <img
      src={src}
      alt={title ?? ""}
      className={cn("shrink-0 object-contain", className)}
      decoding="async"
      draggable={false}
    />
  );
}

/** Official Instagram glyph with brand gradient (Simple Icons path). */
export function InstagramIcon({ className, title = "Instagram" }: BrandIconProps) {
  const gradientId = "corpergo-instagram-gradient";
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <radialGradient id={gradientId} cx="0.35" cy="1.05" r="1.4">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#FCAF45" />
          <stop offset="50%" stopColor="#F77737" />
          <stop offset="75%" stopColor="#F56040" />
          <stop offset="100%" stopColor="#C13584" />
        </radialGradient>
      </defs>
      <path fill={`url(#${gradientId})`} d={siInstagram.path} />
    </svg>
  );
}

export function FacebookIcon({ className, title = "Facebook" }: BrandIconProps) {
  return <SimpleBrandIcon icon={siFacebook} className={className} title={title} />;
}

export function YouTubeIcon({ className, title = "YouTube" }: BrandIconProps) {
  return <SimpleBrandIcon icon={siYoutube} className={className} title={title} />;
}

/** Official Gmail logo (Google CDN). */
export function GmailIcon({ className, title = "Gmail" }: BrandIconProps) {
  return <BrandImageIcon src={gmailLogo} className={className} title={title} />;
}

/** Official Google Maps logo (Google CDN). */
export function GoogleMapsIcon({ className, title = "Google Maps" }: BrandIconProps) {
  return <BrandImageIcon src={googleMapsLogo} className={className} title={title} />;
}

/** Official Phone by Google app logo. */
export function PhoneAppIcon({ className, title = "Phone" }: BrandIconProps) {
  return <BrandImageIcon src={googlePhoneLogo} className={className} title={title} />;
}
