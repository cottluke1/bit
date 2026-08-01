"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { CtaButton } from "@/components/onboarding/cta-button";

export default function ProcessingPage() {
  const router = useRouter();

  return (
    <WizardShell step={3} total={6}>
      <div className="fade-up flex flex-col items-center text-center">
        <div className="relative mb-8 flex h-16 w-16 items-center justify-center">
          <span
            className="ping-ring absolute inset-0 rounded-full border border-white/15"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="ping-ring absolute inset-0 rounded-full border border-white/15"
            style={{ animationDelay: "1s" }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <Sparkles className="size-6 text-white/70" />
          </div>
        </div>

        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
          Almost there
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Setting up your workspace
        </h1>
        <p className="mb-12 max-w-sm text-base text-white/60">
          We&apos;re preparing your templates based on your details.
          Everything&apos;s ready when you are.
        </p>

        <CtaButton onClick={() => router.push("/verify")}>Continue</CtaButton>
      </div>
    </WizardShell>
  );
}
