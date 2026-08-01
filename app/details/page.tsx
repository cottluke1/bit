"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { CtaButton } from "@/components/onboarding/cta-button";

export default function DetailsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const canContinue = fullName.trim().length > 0 && companyName.trim().length > 0;

  return (
    <WizardShell step={2} total={6}>
      <div className="fade-up">
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
          Project details
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Tell us about your project
        </h1>
        <p className="mb-2 text-base text-white/60">
          We&apos;ll tailor your template to fit your brand from the very
          first screen.
        </p>
        <p className="mb-10 text-sm text-white/35">
          This takes less than a minute &mdash; you can always change it
          later.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canContinue) router.push("/processing");
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="fullName"
              className="text-sm font-medium text-white/70"
            >
              Full name
            </label>
            <Input
              id="fullName"
              autoComplete="name"
              placeholder="Jane Cooper"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-xl border-white/10 bg-white/[0.03] px-4 text-white placeholder:text-white/25 focus-visible:ring-white/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="companyName"
              className="text-sm font-medium text-white/70"
            >
              Company name
            </label>
            <Input
              id="companyName"
              autoComplete="organization"
              placeholder="Acme Studio"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-12 rounded-xl border-white/10 bg-white/[0.03] px-4 text-white placeholder:text-white/25 focus-visible:ring-white/20"
            />
          </div>

          <div className="mt-4">
            <CtaButton type="submit" disabled={!canContinue}>
              Continue
            </CtaButton>
          </div>
        </form>
      </div>
    </WizardShell>
  );
}
