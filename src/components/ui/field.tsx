import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type FieldProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

/** Campo de texto com rótulo, dica e erro ligados por aria. */
export function Field({ id, label, error, hint, className, ...props }: FieldProps) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-display text-base font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          "h-12 rounded-2xl border-2 border-border bg-surface px-4 text-base text-foreground",
          "placeholder:text-muted/70 transition-colors duration-150",
          "hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30",
          error && "border-coral hover:border-coral focus-visible:border-coral focus-visible:ring-coral/30",
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-coral-edge">
          {error}
        </p>
      )}
    </div>
  );
}
