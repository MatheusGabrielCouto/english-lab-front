import { cn } from "@/lib/cn";

export function Progress({
  value,
  label,
  className,
}: {
  /** 0 a 100 */
  value: number;
  label: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        "h-4 w-full overflow-hidden rounded-pill bg-surface-soft",
        className,
      )}
    >
      <div
        className="h-full rounded-pill bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
