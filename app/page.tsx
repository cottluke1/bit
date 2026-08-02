"use client";

import { useRouter } from "next/navigation";
import { CtaButton } from "@/components/onboarding/cta-button";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[560px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.18] blur-[130px]"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.45 0 0), oklch(0.6 0 0))",
        }}
      />

     <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
  <h1
    className="fade-up mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-3xl font-extrabold leading-[1.1] tracking-tighter text-transparent sm:text-4xl md:text-5xl"
    style={{ animationDelay: "0ms" }}
  >
    Your Crypto. Your Control. Your Security.
  </h1>

  <p
    className="fade-up mb-3 max-w-xl text-sm text-white/70 sm:text-base"
    style={{ animationDelay: "150ms" }}
  >
    Ultro Crypto is a secure bridge for modern payments. We provide a safe
    way to connect wire transfers with crypto wallets and ensure every
    transaction reaches the right destination. Ultro Crypto integrates with
    all major crypto exchange platforms, including Binance, Coinbase,
    Crypto.com, and Kraken.
  </p>

  <p
    className="fade-up mb-10 max-w-lg text-sm text-white/40"
    style={{ animationDelay: "280ms" }}
  >
    Received a redemption code from your sender? Redeem it below in just a
    few easy steps.
  </p>

  <div className="fade-up" style={{ animationDelay: "400ms" }}>
    <CtaButton onClick={() => router.push("/details")}>
      Redeem Transfer
    </CtaButton>
  </div>
</div>
