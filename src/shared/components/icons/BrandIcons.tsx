import type { SimpleIcon } from "simple-icons";
import { siInstagram, siYoutube, siWhatsapp } from "simple-icons";
import gmailLogo from "@/assets/icons/gmail-logo.webp";
import googleMapsLogo from "@/assets/icons/google-maps-logo.webp";
import googlePhoneLogo from "@/assets/icons/google-phone-logo.webp";
import { cn } from "@/lib/core/utils";

type BrandIconProps = {
  className?: string;
  title?: string;
};

function SimpleBrandIcon({ icon, className, title }: BrandIconProps & { icon: SimpleIcon }) {
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

function BrandImageIcon({ src, className, title }: BrandIconProps & { src: string }) {
  return (
    <img
      src={src}
      alt={title ?? ""}
      className={cn("shrink-0 object-contain", className)}
      decoding="async"
      loading="lazy"
      width={24}
      height={24}
      draggable={false}
    />
  );
}

/** Official Instagram glyph with brand gradient (Simple Icons path). */
export function InstagramIcon({ className, title = "Instagram" }: BrandIconProps) {
  const gradientId = "corpergo-instagram-gradient";
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} role="img" aria-label={title}>
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

export function YouTubeIcon({ className, title = "YouTube" }: BrandIconProps) {
  return <SimpleBrandIcon icon={siYoutube} className={className} title={title} />;
}

export function WhatsAppIcon({ className, title = "WhatsApp" }: BrandIconProps) {
  return <SimpleBrandIcon icon={siWhatsapp} className={className} title={title} />;
}

/** Official LinkedIn "in" mark, LinkedIn Blue #0A66C2. */
export function LinkedInIcon({ className, title = "LinkedIn" }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} role="img" aria-label={title}>
      <title>{title}</title>
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
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
