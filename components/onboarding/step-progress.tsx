import { cn } from "@/lib/utils";

export function StepProgress({
  step,
  total = 4,
}: {
  step: number;
  total?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-[3px] w-8 rounded-full transition-colors duration-500",
            i < step ? "bg-white" : "bg-white/12"
          )}
        />
      ))}
    </div>
  );
}
