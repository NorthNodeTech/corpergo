import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { CameraOff, SwitchCamera } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type QrCameraScannerProps = {
  onScan: (decodedText: string) => void;
  paused?: boolean;
  className?: string;
};

/**
 * Camera QR scanner — single clean video surface.
 * html5-qrcode injects video + canvas; we hide everything except the live video.
 */
export function QrCameraScanner({ onScan, paused = false, className }: QrCameraScannerProps) {
  const reactId = useId().replace(/:/g, "");
  const regionId = `qr-cam-${reactId}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef("");
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraKey, setCameraKey] = useState(0);

  useEffect(() => {
    if (paused) {
      setReady(false);
      return;
    }

    let cancelled = false;
    const scanner = new Html5Qrcode(regionId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;

    async function start() {
      setError(null);
      setReady(false);
      lastScanRef.current = "";

      try {
        await scanner.start(
          { facingMode: { ideal: facingMode } },
          {
            fps: 12,
            // Slightly inset box; library shading is hidden via CSS
            qrbox: (w, h) => {
              const size = Math.floor(Math.min(w, h) * 0.7);
              return { width: size, height: size };
            },
            // Avoid forcing 1:1 — that often stretches laptop cams into a tall double-frame look
            aspectRatio: 1.333,
            disableFlip: false,
          },
          (decodedText) => {
            if (!decodedText || decodedText === lastScanRef.current) return;
            lastScanRef.current = decodedText;
            onScanRef.current(decodedText);
          },
          () => undefined,
        );

        if (!cancelled) setReady(true);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Camera permission denied or unavailable on this device.",
        );
      }
    }

    void start();

    return () => {
      cancelled = true;
      const active = scannerRef.current;
      scannerRef.current = null;
      if (!active) return;
      if (active.isScanning) {
        void active
          .stop()
          .then(() => active.clear())
          .catch(() => undefined);
      } else {
        try {
          active.clear();
        } catch {
          // already cleared
        }
      }
    };
  }, [facingMode, cameraKey, paused, regionId]);

  function flipCamera() {
    lastScanRef.current = "";
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setCameraKey((k) => k + 1);
  }

  function retry() {
    lastScanRef.current = "";
    setCameraKey((k) => k + 1);
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "qr-scanner-shell relative mx-auto w-full overflow-hidden rounded-[1.75rem] bg-zinc-950 ring-1 ring-black/10",
          "aspect-[4/3] max-h-[min(52vh,420px)]",
        )}
      >
        {/* Library mounts into this node — keep empty; CSS keeps only <video> visible */}
        <div id={regionId} className="qr-scanner-host absolute inset-0 h-full w-full" />

        {!ready && !error && !paused ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-zinc-950 text-sm font-semibold text-white">
            Opening camera…
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center text-white">
            <CameraOff className="h-10 w-10 text-white/70" />
            <p className="text-sm font-semibold leading-relaxed">{error}</p>
            <p className="text-xs text-white/70">
              Allow camera access in your browser settings, then try again.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)]"
            >
              Retry camera
            </button>
          </div>
        ) : null}

        {ready && !paused && !error ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="relative h-[62%] w-[62%] max-w-[260px] max-h-[260px]">
              <div className="absolute inset-0 rounded-3xl border border-white/35" />
              {/* Corner brackets */}
              <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white" />
              <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white" />
              <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white" />
              <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-[3px] border-r-[3px] border-white" />
            </div>
            <div className="absolute inset-0 bg-black/25 [mask:radial-gradient(circle_at_center,transparent_38%,black_39%)]" />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--ink-soft)]">
          Hold the patient’s QR ticket steady inside the frame.
        </p>
        <button
          type="button"
          onClick={flipCamera}
          disabled={!!error || paused}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--ivory)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5 disabled:opacity-40"
        >
          <SwitchCamera className="h-4 w-4" /> Flip camera
        </button>
      </div>

      {/* Scoped overrides: hide canvas / shaded region that cause the “double camera” look */}
      <style>{`
        .qr-scanner-host,
        .qr-scanner-host > div,
        #${regionId},
        #${regionId} > div {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
          position: relative !important;
        }
        #${regionId} video {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          object-fit: cover !important;
          object-position: center !important;
          transform: none !important;
          border-radius: 0 !important;
          display: block !important;
          z-index: 1 !important;
        }
        #${regionId} canvas,
        #${regionId} img,
        #${regionId} #qr-shaded-region,
        #${regionId} [id*="qr-shaded"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
}
