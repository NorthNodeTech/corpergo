import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, Clock, QrCode, UserRound } from "lucide-react";
import { GoogleMapsIcon } from "@/shared/components/icons/BrandIcons";
import { useEffect, useState } from "react";
import { EmptyState } from "@/shared/components/layout/EmptyState";
import { PortalPageHeader } from "@/shared/components/layout/PortalPageHeader";
import { LoadingState } from "@/shared/components/ui/loading-spinner";
import { ShowMoreButton, useShowMore } from "@/shared/components/layout/ShowMoreList";
import {
  fetchAcceptedTickets,
  formatDateLabel,
  formatTimeLabel,
  type Appointment,
  type QrTicket,
} from "@/lib/patient/clinic-data";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/patient/qr-ticket")({
  component: QrTicketPage,
  head: () =>
    privateRouteHead(
      "/patient/qr-ticket",
      "QR Tickets - CorpErgo Patient Portal",
      "Open accepted appointment QR tickets for CorpErgo clinic check-in.",
    ),
});

type TicketRow = QrTicket & { appointments: Appointment | null };

function QrTicketPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const listMore = useShowMore(tickets);

  useEffect(() => {
    let cancelled = false;
    void fetchAcceptedTickets().then((res) => {
      if (cancelled) return;
      setTickets((res.data as TicketRow[]) || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PortalPageHeader
        eyebrow="Check-in"
        title="QR tickets"
        description="Show this boarding-pass style ticket at reception once your appointment is accepted."
      />

      {loading ? (
        <LoadingState label="Loading QR tickets…" minHeight="min-h-[18rem]" />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No active QR tickets"
          description="Tickets appear after the clinic accepts your appointment request."
          action={
            <Link
              to="/patient/appointments"
              className="rounded-full bg-[var(--sage)] px-5 py-2.5 text-sm font-bold text-white"
            >
              Check appointments
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {listMore.visible.map((t) => {
              const a = t.appointments;
              if (!a) return null;
              const doctor = a.physiotherapists?.profiles?.full_name || "Assigned at clinic";
              return (
                <article
                  key={t.id}
                  className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-black via-neutral-800 to-[var(--saffron)] text-white shadow-md"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/15">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                        CorpErgo boarding pass
                      </div>
                      <div className="mt-1 text-lg font-extrabold">{a.appointment_code}</div>
                    </div>
                    <QrCode className="h-6 w-6 text-white/80" />
                  </div>

                  <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] items-center">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <GoogleMapsIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <div className="text-white/70 text-xs uppercase tracking-wider font-bold">
                            Clinic
                          </div>
                          <div className="font-bold text-base">{a.clinics?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                        <div>
                          <div className="text-white/70 text-xs uppercase tracking-wider font-bold">
                            Doctor
                          </div>
                          <div className="font-bold text-base">{doctor}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-white/80" />
                          <span className="font-semibold">
                            {formatDateLabel(a.scheduled_date || a.preferred_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-white/80" />
                          <span className="font-semibold">
                            {formatTimeLabel(a.scheduled_time || a.preferred_time)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mx-auto rounded-2xl bg-white p-3 shadow-lg">
                      <QRCodeSVG value={t.token} size={148} level="M" includeMargin={false} />
                    </div>
                  </div>

                  <div className="border-t border-dashed border-white/25 px-6 py-3 text-xs text-white/75">
                    Present this code at {a.clinics?.name || "the clinic"} reception for check-in.
                  </div>
                </article>
              );
            })}
          </div>
          <ShowMoreButton
            hiddenCount={listMore.hiddenCount}
            expanded={listMore.expanded}
            onClick={listMore.toggle}
          />
        </>
      )}
    </div>
  );
}
