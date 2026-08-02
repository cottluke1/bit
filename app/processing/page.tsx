"use client";

import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { CtaButton } from "@/components/onboarding/cta-button";

export default function ProcessingPage() {
  const router = useRouter();

  return (
    <WizardShell step={3} total={6}>
      <div className="fade-up relative left-1/2 flex w-[min(1100px,calc(100vw-3rem))] -translate-x-1/2 flex-col items-center text-center">
        <h1 className="mb-10 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
          Step 2: Facial Verification
        </h1>

        <p className="mb-12 w-full max-w-4xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl">
          Verification steps should be performed by the recipient.
        </p>

        <CtaButton onClick={() => router.push("/verify")}>
          Begin Verification
        </CtaButton>
      </div>
    </WizardShell>
  );
}
