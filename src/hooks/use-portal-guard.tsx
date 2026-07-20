import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  fetchMyProfile,
  getStoredSession,
  portalPathForRole,
  rolesAllowedForPath,
  type UserProfile,
} from "@/lib/auth";

export function usePortalGuard(pathPrefix: "/patient" | "/physio" | "/admin") {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      void navigate({ to: "/login" });
      return;
    }

    const allowed = rolesAllowedForPath(pathPrefix);
    let cancelled = false;

    void fetchMyProfile().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        void navigate({ to: "/login" });
        return;
      }
      if (!allowed.includes(data.role)) {
        void navigate({ to: portalPathForRole(data.role) });
        return;
      }
      setProfile(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [pathPrefix, navigate]);

  return { profile, loading };
}

export function PortalGuard({
  pathPrefix,
  children,
  fallback,
}: {
  pathPrefix: "/patient" | "/physio" | "/admin";
  children: (ctx: { profile: UserProfile }) => ReactNode;
  fallback?: ReactNode;
}) {
  const { profile, loading } = usePortalGuard(pathPrefix);

  if (loading || !profile) {
    return (
      fallback ?? (
        <div className="min-h-screen grid place-items-center bg-[var(--ivory)] text-[var(--ink-soft)]">
          Loading your portal…
        </div>
      )
    );
  }

  return <>{children({ profile })}</>;
}
