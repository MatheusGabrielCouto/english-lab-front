import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "sky" | "coral" | "ghost";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary shadow-[0_4px_0_0_var(--color-primary-edge)] hover:brightness-105",
  sky: "bg-sky text-ink shadow-[0_4px_0_0_var(--color-sky-edge)] hover:brightness-105",
  coral:
    "bg-coral text-ink shadow-[0_4px_0_0_var(--color-coral-edge)] hover:brightness-105",
  ghost:
    "bg-surface text-foreground border-2 border-border shadow-[0_4px_0_0_var(--color-border)] hover:bg-surface-soft",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-base",
  lg: "h-14 px-8 text-lg",
};

/** Botão "gordinho": a sombra sólida some quando pressionado. */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-pill font-display font-semibold tracking-wide",
    "transition-[transform,box-shadow,filter] duration-150 ease-out",
    "active:translate-y-1 active:shadow-none",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props} />
  );
}
