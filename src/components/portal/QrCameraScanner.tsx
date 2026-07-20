import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, SwitchCamera } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type QrCameraScannerProps = {
  onScan: (decodedText: string) => void;
  paused?: boolean;
  className?: string;
};

type CameraDevice = { id: string; label: string };

/**
 * Live QR scanner.
 * Starts only after an explicit tap (required on mobile browsers for getUserMedia).
 */
export function QrCameraScanner({ onScan, paused = false, className }: QrCameraScannerProps) {
  const reactId = useId().replace(/:/g, "");
  const regionId = `qr-cam-${reactId}`;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef("");
  const onScanRef = useRef(onScan);
  const camerasRef = useRef<CameraDevice[]>([]);
  const cameraIndexRef = useRef(0);
  const runIdRef = useRef(0);
  onScanRef.current = onScan;

  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameraLabel, setCameraLabel] = useState("");
  const [cameraKey, setCameraKey] = useState(0);

  useEffect(() => {
    if (!armed || paused) {
      setReady(false);
      return;
    }

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot open a camera. Use Chrome/Safari on HTTPS or localhost.");
      return;
    }

    // Secure context required (https / localhost). LAN http://192.168.x.x will fail on phones.
    if (!window.isSecureContext) {
      setError(
        "Camera needs a secure page (https:// or localhost). Open the deployed HTTPS site, not a plain http LAN address.",
      );
      return;
    }

    const runId = ++runIdRef.current;
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    const scanConfig = {
      fps: 10,
      qrbox: (w: number, h: number) => {
        const size = Math.floor(Math.min(w, h) * 0.72);
        return { width: size, height: size };
      },
      aspectRatio: 1.333,
      disableFlip: false,
      videoConstraints: undefined as MediaTrackConstraints | undefined,
    };

    async function waitForHost() {
      for (let i = 0; i < 20; i++) {
        const el = document.getElementById(regionId);
        if (el) return el;
        await new Promise((r) => setTimeout(r, 50));
      }
      throw new Error("Scanner view is not ready yet. Tap Start camera again.");
    }

    async function stopScanner(instance: Html5Qrcode | null) {
      if (!instance) return;
      try {
        if (instance.isScanning) await instance.stop();
      } catch {
        // ignore
      }
      try {
        instance.clear();
      } catch {
        // ignore
      }
    }

    async function listCameras(): Promise<CameraDevice[]> {
      const devices = await Html5Qrcode.getCameras();
      return (devices || [])
        .filter((d) => d?.id)
        .map((d) => ({ id: d.id, label: d.label?.trim() || "Camera" }));
    }

    function preferBackIndex(cameras: CameraDevice[]) {
      const idx = cameras.findIndex((c) =>
        /back|rear|environment|world|facing back/i.test(c.label),
      );
      return idx >= 0 ? idx : 0;
    }

    async function startWithConstraint(
      instance: Html5Qrcode,
      camera: string | MediaTrackConstraints,
    ) {
      await instance.start(
        camera,
        scanConfig,
        (decodedText) => {
          if (!decodedText || decodedText === lastScanRef.current) return;
          lastScanRef.current = decodedText;
          onScanRef.current(decodedText);
        },
        () => undefined,
      );
    }

    async function start() {
      setError(null);
      setReady(false);
      setStarting(true);
      lastScanRef.current = "";

      try {
        await waitForHost();
        if (cancelled || runId !== runIdRef.current) return;

        // Clear any leftover markup from a previous attempt
        const host = document.getElementById(regionId);
        if (host) host.innerHTML = "";

        scanner = new Html5Qrcode(regionId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = scanner;

        const attempts: Array<{ label: string; camera: string | MediaTrackConstraints }> = [];

        // 1) Prefer rear camera on phones via facingMode (no deviceId needed)
        attempts.push({
          label: "Back camera",
          camera: { facingMode: { ideal: "environment" } },
        });
        attempts.push({
          label: "Front camera",
          camera: { facingMode: { ideal: "user" } },
        });
        attempts.push({
          label: "Any camera",
          camera: { facingMode: "environment" },
        });

        // 2) Then explicit device IDs from the device list
        let cameras = camerasRef.current;
        if (!cameras.length) {
          try {
            cameras = await listCameras();
            camerasRef.current = cameras;
            cameraIndexRef.current = preferBackIndex(cameras);
          } catch {
            cameras = [];
          }
        }

        if (cameras.length) {
          const startAt = Math.min(Math.max(cameraIndexRef.current, 0), cameras.length - 1);
          for (let offset = 0; offset < cameras.length; offset++) {
            const i = (startAt + offset) % cameras.length;
            attempts.push({ label: cameras[i].label, camera: cameras[i].id });
          }
        }

        let lastError: unknown = null;
        let started = false;

        for (const attempt of attempts) {
          if (cancelled || runId !== runIdRef.current) return;
          try {
            await stopScanner(scanner);
            scanner = new Html5Qrcode(regionId, {
              formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
              verbose: false,
            });
            scannerRef.current = scanner;
            await startWithConstraint(scanner, attempt.camera);
            setCameraLabel(attempt.label);
            started = true;
            break;
          } catch (err) {
            lastError = err;
          }
        }

        if (!started) throw lastError || new Error("Could not open any camera on this device.");
        if (!cancelled && runId === runIdRef.current) setReady(true);
      } catch (err) {
        if (cancelled || runId !== runIdRef.current) return;
        const name = err && typeof err === "object" && "name" in err ? String((err as { name: string }).name) : "";
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Could not open the camera on this device.";
        const lower = `${name} ${message}`.toLowerCase();

        if (lower.includes("notallowed") || lower.includes("permission") || lower.includes("denied")) {
          const host = typeof window !== "undefined" ? window.location.host : "this site";
          setError(
            `Camera is blocked for ${host}. Click the lock icon in the address bar → Site settings → Camera → Allow, then tap Start camera.`,
          );
        } else if (lower.includes("notfound") || lower.includes("no camera") || lower.includes("devices not found")) {
          setError("No camera was found on this device.");
        } else if (lower.includes("notreadable") || lower.includes("trackstart") || lower.includes("in use")) {
          setError("Camera is busy in another app. Close Instagram/Meet/Camera, then tap Start camera.");
        } else if (lower.includes("secure") || lower.includes("https")) {
          setError(message);
        } else {
          setError(message);
        }
      } finally {
        if (!cancelled && runId === runIdRef.current) setStarting(false);
      }
    }

    void start();

    return () => {
      cancelled = true;
      const active = scannerRef.current;
      scannerRef.current = null;
      void stopScanner(active);
    };
  }, [armed, cameraKey, paused, regionId]);

  // When parent pauses after a successful scan, stop the live stream
  useEffect(() => {
    if (!paused) return;
    const active = scannerRef.current;
    scannerRef.current = null;
    setReady(false);
    if (!active) return;
    void (async () => {
      try {
        if (active.isScanning) await active.stop();
      } catch {
        // ignore
      }
      try {
        active.clear();
      } catch {
        // ignore
      }
    })();
  }, [paused]);

  function startCamera() {
    setError(null);
    setArmed(true);
    setCameraKey((k) => k + 1);
  }

  function flipCamera() {
    const cameras = camerasRef.current;
    lastScanRef.current = "";
    if (cameras.length >= 2) {
      cameraIndexRef.current = (cameraIndexRef.current + 1) % cameras.length;
    }
    setCameraKey((k) => k + 1);
  }

  function retry() {
    lastScanRef.current = "";
    camerasRef.current = [];
    cameraIndexRef.current = 0;
    setError(null);
    setArmed(true);
    setCameraKey((k) => k + 1);
  }

  const showIdle = !armed && !error && !paused;
  const showLoading = armed && starting && !ready && !error && !paused;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "qr-scanner-shell relative mx-auto w-full overflow-hidden rounded-[1.75rem] bg-zinc-950 ring-1 ring-black/10",
          "aspect-[4/3] max-h-[min(52vh,420px)]",
        )}
      >
        <div
          id={regionId}
          ref={hostRef}
          className="qr-scanner-host absolute inset-0 h-full w-full"
        />

        {showIdle ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-white">
            <Camera className="h-10 w-10 text-white/80" />
            <p className="text-sm font-semibold leading-relaxed">
              Tap below to turn on this device’s camera and scan the patient QR.
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="rounded-full bg-[var(--sage)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/20"
            >
              Start camera
            </button>
          </div>
        ) : null}

        {showLoading ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-zinc-950 px-6 text-center text-sm font-semibold text-white">
            Opening camera…
            <span className="mt-2 block text-xs font-medium text-white/60">
              Allow Camera when the browser asks
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center text-white">
            <CameraOff className="h-10 w-10 text-white/70" />
            <p className="text-sm font-semibold leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)]"
            >
              Start camera
            </button>
          </div>
        ) : null}

        {ready && !paused && !error ? (
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
          {cameraLabel
            ? `Using ${cameraLabel}. Hold the QR ticket steady inside the frame.`
            : "Hold the patient’s QR ticket steady inside the frame."}
        </p>
        <button
          type="button"
          onClick={flipCamera}
          disabled={!armed || !!error || paused || starting}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--ivory)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5 disabled:opacity-40"
        >
          <SwitchCamera className="h-4 w-4" /> Flip camera
        </button>
      </div>

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
