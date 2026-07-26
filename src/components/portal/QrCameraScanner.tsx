import { Scanner } from "@yudiel/react-qr-scanner";
import { Camera, CameraOff, SwitchCamera } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type QrCameraScannerProps = {
  onScan: (decodedText: string) => void;
  paused?: boolean;
  className?: string;
};

/**
 * Modern, industry-standard QR Scanner using @yudiel/react-qr-scanner.
 * This completely resolves html5-qrcode iOS quirks with constraints and canvas rendering.
 */
export function QrCameraScanner({ onScan, paused = false, className }: QrCameraScannerProps) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleScan(result: any[]) {
    if (result && result.length > 0 && result[0].rawValue) {
      onScan(result[0].rawValue);
    }
  }

  function handleError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.toLowerCase().includes("notallowed") ||
      message.toLowerCase().includes("permission")
    ) {
      setError("Camera is blocked. Click the lock icon in the address bar → Allow camera.");
    } else if (
      message.toLowerCase().includes("notfound") ||
      message.toLowerCase().includes("no camera")
    ) {
      setError("No camera was found on this device.");
    } else {
      setError(message || "Could not open the camera on this device.");
    }
  }

  const showIdle = !armed && !error;
  const showError = !!error;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative mx-auto w-full overflow-hidden rounded-[1.75rem] bg-zinc-950 ring-1 ring-black/10",
          "aspect-[4/3] max-h-[min(52vh,420px)]",
        )}
      >
        {!showIdle && !showError && (
          <div className="absolute inset-0">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              paused={paused}
              formats={["qr_code"]}
              constraints={{ facingMode }}
              components={{
                finder: false,
              }}
              styles={{
                container: { width: "100%", height: "100%", padding: 0 },
                video: { objectFit: "cover", width: "100%", height: "100%" },
              }}
            />
          </div>
        )}

        {showIdle ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-white">
            <Camera className="h-10 w-10 text-white/80" />
            <p className="text-sm font-semibold leading-relaxed">
              Tap below to turn on this device’s camera and scan the patient QR.
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setArmed(true);
              }}
              className="rounded-full bg-[var(--sage)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/20"
            >
              Start camera
            </button>
          </div>
        ) : null}

        {showError ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center text-white">
            <CameraOff className="h-10 w-10 text-white/70" />
            <p className="text-sm font-semibold leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setArmed(true);
              }}
              className="mt-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)]"
            >
              Start camera
            </button>
          </div>
        ) : null}

        {!showIdle && !showError && !paused ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="relative h-[62%] w-[62%] max-w-[260px] max-h-[260px]">
              <div className="absolute inset-0 rounded-3xl border border-white/35" />
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
          {facingMode === "environment"
            ? "Using Back camera. Hold the QR ticket steady."
            : "Using Front camera. Hold the QR ticket steady."}
        </p>
        <button
          type="button"
          onClick={() =>
            setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
          }
          disabled={!armed || !!error || paused}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--ivory)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5 disabled:opacity-40"
        >
          <SwitchCamera className="h-4 w-4" /> Flip camera
        </button>
      </div>
    </div>
  );
}
