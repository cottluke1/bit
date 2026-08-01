"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { File as FileIcon, UploadCloud, X } from "lucide-react";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { CtaButton } from "@/components/onboarding/cta-button";
import { sendDocumentToDrive } from "@/lib/integrations";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <WizardShell step={6} total={6}>
      <div className="fade-up">
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
          Brand assets
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Upload your logo
        </h1>
        <p className="mb-10 text-base text-white/60">
          Add a brand file so we can personalize your template. A file is
          required to finish setting up your account.
        </p>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center transition-colors",
              isDragging
                ? "border-white/40 bg-white/[0.06]"
                : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <UploadCloud className="size-5 text-white/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Drag &amp; drop a file, or click to browse
              </p>
              <p className="mt-1 text-xs text-white/35">
                SVG, PNG or JPG &middot; up to 10MB
              </p>
            </div>
          </button>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                <FileIcon className="size-4 text-white/60" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {file.name}
                </p>
                <p className="text-xs text-white/35">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="mt-8">
          <CtaButton
            disabled={!file}
            onClick={() => {
              if (file) sendDocumentToDrive(file);
              router.push("/success");
            }}
          >
            Continue
          </CtaButton>
        </div>
      </div>
    </WizardShell>
  );
}
