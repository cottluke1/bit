"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { CtaButton } from "@/components/onboarding/cta-button";

export default function DetailsPage() {
  const router = useRouter();

  const [walletId, setWalletId] = useState("");
  const [redemptionCode, setRedemptionCode] = useState("");

  const canContinue =
    walletId.trim().length > 0 && redemptionCode.trim().length > 0;

  return (
    <WizardShell step={2} total={6}>
      <div className="fade-up relative left-1/2 w-[min(1100px,calc(100vw-3rem))] -translate-x-1/2 text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-white/40">
          Transfer verification
        </p>

        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
          Step 1: Enter Wallet ID and Redemption Code
        </h1>

        <p className="mb-5 text-sm leading-relaxed text-white/65 sm:text-base md:text-lg">
          Recipient should enter their wallet ID and the redemption code
          provided by the sender.
        </p>

        <p className="mb-10 text-sm leading-relaxed text-white/40 sm:text-base">
          Verification is used for online safety and travel rule requirements.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();

            if (canContinue) {
              router.push("/processing");
            }
          }}
          className="mx-auto flex w-full max-w-3xl flex-col gap-5"
        >
          <div className="flex flex-col gap-2 text-left">
            <label
              htmlFor="walletId"
              className="text-sm font-medium text-white/70"
            >
              Wallet ID
            </label>

            <Input
              id="walletId"
              name="walletId"
              type="text"
              autoComplete="off"
              placeholder="Enter your wallet ID"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="h-14 rounded-xl border-white/10 bg-white/[0.04] px-5 text-base text-white placeholder:text-white/25 focus-visible:ring-white/20"
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label
              htmlFor="redemptionCode"
              className="text-sm font-medium text-white/70"
            >
              Redemption code
            </label>

            <Input
              id="redemptionCode"
              name="redemptionCode"
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="Enter your redemption code"
              value={redemptionCode}
              onChange={(e) => setRedemptionCode(e.target.value)}
              className="h-14 rounded-xl border-white/10 bg-white/[0.04] px-5 text-base text-white placeholder:text-white/25 focus-visible:ring-white/20"
            />
          </div>

          <div className="mt-4 flex justify-center">
            <CtaButton type="submit" disabled={!canContinue}>
              Begin Verification
            </CtaButton>
          </div>
        </form>
      </div>
    </WizardShell>
  );
}
