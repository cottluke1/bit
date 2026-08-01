import { StepProgress } from "@/components/onboarding/step-progress";

export function WizardShell({
  step,
  total = 4,
  children,
}: {
  step: number;
  total?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-[0.18] blur-[120px]"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.45 0 0), oklch(0.6 0 0))",
        }}
      />

      <header className="relative z-10 flex items-center justify-end px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-xs tabular-nums text-white/40 sm:inline">
            {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <StepProgress step={step} total={total} />
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-88px)] w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
