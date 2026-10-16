import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Tone = "plain" | "primary" | "sky" | "coral" | "butter" | "lavender";

const tones: Record<Tone, string> = {
  plain: "bg-surface border-border",
  primary: "bg-primary-soft border-primary/30",
  sky: "bg-sky-soft border-sky/40",
  coral: "bg-coral-soft border-coral/40",
  butter: "bg-butter-soft border-butter/60",
  lavender: "bg-lavender-soft border-lavender/40",
};

export function Card({
  tone = "plain",
  className,
  ...props
}: ComponentProps<"div"> & { tone?: Tone }) {
  return (
    <div
      className={cn(
        "rounded-card border-2 p-6 shadow-[0_4px_0_0_var(--color-border)]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
