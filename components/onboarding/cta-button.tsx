"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CtaButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "group inline-flex items-center gap-4 rounded-full border border-white/15 bg-neutral-900 py-1.5 pr-1.5 pl-6 transition-colors duration-300",
        "hover:border-white/25 hover:bg-white/[0.08]",
        "disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...props}
    >
      <span className="text-[15px] font-bold tracking-tight text-white">
        {children}
      </span>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0.5">
        <ArrowRight className="size-4 text-white" />
      </span>
    </button>
  );
}
