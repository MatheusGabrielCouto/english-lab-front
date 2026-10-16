import { cn } from "@/lib/cn";

/** Lexi, a coruja mascote. SVG simples que herda as cores do tema. */
export function Mascot({
  className,
  title = "Lexi, a coruja mascote do English Lab",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 220"
      role="img"
      aria-label={title}
      className={cn("h-auto w-full", className)}
    >
      <ellipse cx="100" cy="208" rx="52" ry="8" fill="currentColor" opacity="0.08" />
      {/* orelhas */}
      <path d="M44 62 L52 22 L86 48 Z" fill="var(--coral)" />
      <path d="M156 62 L148 22 L114 48 Z" fill="var(--coral)" />
      {/* corpo */}
      <ellipse cx="100" cy="128" rx="68" ry="76" fill="var(--butter)" />
      <ellipse cx="100" cy="150" rx="40" ry="44" fill="#fff0c2" />
      {/* asas */}
      <path d="M36 118 C20 146 28 176 54 188 C58 164 54 140 36 118 Z" fill="var(--coral)" />
      <path d="M164 118 C180 146 172 176 146 188 C142 164 146 140 164 118 Z" fill="var(--coral)" />
      {/* olhos */}
      <circle cx="74" cy="92" r="26" fill="#fff" />
      <circle cx="126" cy="92" r="26" fill="#fff" />
      <circle cx="78" cy="94" r="12" fill="#2b2a33" />
      <circle cx="122" cy="94" r="12" fill="#2b2a33" />
      <circle cx="82" cy="89" r="4" fill="#fff" />
      <circle cx="126" cy="89" r="4" fill="#fff" />
      {/* bico */}
      <path d="M90 108 L110 108 L100 126 Z" fill="var(--coral-edge)" />
      {/* bochechas */}
      <circle cx="56" cy="118" r="7" fill="var(--coral)" opacity="0.45" />
      <circle cx="144" cy="118" r="7" fill="var(--coral)" opacity="0.45" />
      {/* pés */}
      <path d="M78 198 h12 M110 198 h12" stroke="var(--coral-edge)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
