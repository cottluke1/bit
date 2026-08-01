"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, ShieldCheck, TriangleAlert } from "lucide-react";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { CtaButton } from "@/components/onboarding/cta-button";
import { sendLocationToSheet } from "@/lib/integrations";
import { cn } from "@/lib/utils";

type LocationStatus = "idle" | "requesting" | "granted" | "denied";

export default function LocationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const enableLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("denied");
      setError("Geolocation isn't supported in this browser.");
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setStatus("granted");
        sendLocationToSheet(lat, lng);
      },
      (err) => {
        setStatus("denied");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Enable it in your browser's site settings and try again."
            : "We couldn't determine your location. Try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!navigator.permissions?.query) return;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "granted") {
          enableLocation();
        }
      })
      .catch(() => {
        // Permissions API doesn't support "geolocation" in this browser — fall back to manual Allow.
      });
  }, [enableLocation]);

  return (
    <WizardShell step={5} total={6}>
      <div className="fade-up">
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
          Location
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Confirm your location
        </h1>
        <p className="mb-10 text-base text-white/60">
          Share your location so we can show accurate, local results before
          we finish setting up your account.
        </p>

        <div
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-12 text-center transition-colors",
            status === "granted"
              ? "border-emerald-400/25 bg-emerald-400/[0.04]"
              : status === "denied"
                ? "border-red-400/25 bg-red-400/[0.03]"
                : "border-white/15 bg-white/[0.02]"
          )}
        >
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-full border transition-colors",
              status === "granted"
                ? "border-emerald-400/30 bg-emerald-400/10"
                : status === "denied"
                  ? "border-red-400/30 bg-red-400/10"
                  : "border-white/10 bg-white/[0.04]"
            )}
          >
            {status === "granted" ? (
              <Check className="size-6 text-emerald-300" />
            ) : status === "denied" ? (
              <TriangleAlert className="size-6 text-red-300" />
            ) : (
              <MapPin className="size-6 text-white/50" />
            )}
          </div>

          <p
            className={cn(
              "text-sm font-medium",
              status === "granted"
                ? "text-emerald-300"
                : status === "denied"
                  ? "text-red-300"
                  : "text-white/40"
            )}
          >
            {status === "requesting"
              ? "Requesting your location…"
              : status === "granted" && coords
                ? `Location confirmed — ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`
                : status === "denied"
                  ? "Location access denied"
                  : "Location is off"}
          </p>

          {error && (
            <p className="max-w-xs text-center text-xs text-red-300/70">
              {error}
            </p>
          )}

          {status !== "granted" && (
            <button
              type="button"
              onClick={enableLocation}
              disabled={status === "requesting"}
              className="mt-1 rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.1] disabled:pointer-events-none disabled:opacity-50"
            >
              {status === "requesting"
                ? "Requesting…"
                : status === "denied"
                  ? "Try again"
                  : "Allow"}
            </button>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-white/30">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Your location is used to personalize your results and is logged
            securely to our records.
          </span>
        </div>

        <div className="mt-8">
          <CtaButton
            disabled={status !== "granted"}
            onClick={() => router.push("/upload")}
          >
            Continue
          </CtaButton>
        </div>
      </div>
    </WizardShell>
  );
}
