"use client";

import { Check } from "lucide-react";
import { WizardShell } from "@/components/onboarding/wizard-shell";

export default function SuccessPage() {
  return (
    <WizardShell step={6} total={6}>
      <div className="fade-up flex flex-col items-center text-center">
        <div className="mb-8 flex size-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
          <Check className="size-7 text-emerald-300" />
        </div>

        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
          Transaction complete
        </p>

        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Your Bitcoin has been sent
        </h1>

        <p className="max-w-sm text-base text-white/60">
          The transaction was completed successfully. Your Bitcoin has been
          sent to the verified wallet address and may take a few minutes to
          appear on the blockchain.
        </p>
      </div>
    </WizardShell>
  );
}
