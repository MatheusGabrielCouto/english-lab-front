import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Lexi, a coruja mascote (com capelo de formatura).
 * Cores fixas de propósito: o mascote não muda com o tema claro/escuro.
 */
export function Mascot({
  className,
  title = "Lexi, a coruja mascote do English Lab",
}: {
  className?: string;
  title?: string;
}) {
  const id = useId();
  const body = `${id}-body`;
  const wing = `${id}-wing`;
  const belly = `${id}-belly`;
  const iris = `${id}-iris`;

  return (
    <svg
      viewBox="0 0 240 270"
      role="img"
      aria-label={title}
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd166" />
          <stop offset="1" stopColor="#ffa94d" />
        </linearGradient>
        <linearGradient id={wing} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4a259" />
          <stop offset="1" stopColor="#e07b39" />
        </linearGradient>
        <radialGradient id={belly} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#ffe9bd" />
        </radialGradient>
        <radialGradient id={iris} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#6b4a36" />
          <stop offset="1" stopColor="#2e1f17" />
        </radialGradient>
      </defs>

      {/* sombra no chão */}
      <ellipse cx="120" cy="256" rx="62" ry="9" fill="#2b2a33" opacity="0.1" />

      {/* pés */}
      <g fill="#ff7a59" stroke="#e0583a" strokeWidth="3" strokeLinejoin="round">
        <path d="M86 240 q-6 14 4 16 q6 1 8 -6 q3 8 10 6 q8 -3 2 -16 z" />
        <path d="M134 240 q-6 14 4 16 q6 1 8 -6 q3 8 10 6 q8 -3 2 -16 z" />
      </g>

      {/* orelhinhas (tufos) */}
      <g fill="#f4a259" stroke="#e07b39" strokeWidth="3" strokeLinejoin="round">
        <path d="M52 96 C44 74 46 58 50 46 C64 52 78 62 88 76 Z" />
        <path d="M188 96 C196 74 194 58 190 46 C176 52 162 62 152 76 Z" />
      </g>

      {/* corpo */}
      <path
        d="M120 62 C170 62 200 100 200 156 C200 214 168 248 120 248 C72 248 40 214 40 156 C40 100 70 62 120 62 Z"
        fill={`url(#${body})`}
      />
      {/* brilho suave no topo */}
      <ellipse cx="96" cy="86" rx="30" ry="14" fill="#fff" opacity="0.25" transform="rotate(-20 96 86)" />

      {/* asas */}
      <path
        d="M46 138 C22 160 22 206 52 228 C60 232 66 226 66 218 C66 190 64 160 46 138 Z"
        fill={`url(#${wing})`}
      />
      <path
        d="M194 138 C218 160 218 206 188 228 C180 232 174 226 174 218 C174 190 176 160 194 138 Z"
        fill={`url(#${wing})`}
      />
      <g stroke="#c9692c" strokeWidth="3" strokeLinecap="round" opacity="0.5" fill="none">
        <path d="M40 176 q8 6 14 0" />
        <path d="M42 196 q8 6 14 0" />
        <path d="M200 176 q-8 6 -14 0" />
        <path d="M198 196 q-8 6 -14 0" />
      </g>

      {/* barriga com penas */}
      <ellipse cx="120" cy="190" rx="50" ry="54" fill={`url(#${belly})`} />
      <g stroke="#f2c98a" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M96 172 q7 8 14 0 q7 8 14 0 q7 8 14 0" />
        <path d="M88 192 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0" />
        <path d="M94 212 q8 8 16 0 q8 8 16 0 q8 8 16 0" />
      </g>

      {/* máscara do rosto */}
      <path
        d="M120 98 C132 86 164 84 176 108 C186 130 170 150 148 146 C136 144 126 136 120 128 C114 136 104 144 92 146 C70 150 54 130 64 108 C76 84 108 86 120 98 Z"
        fill="#fff3d6"
      />

      {/* olhos */}
      <circle cx="92" cy="116" r="27" fill="#fff" stroke="#f0c987" strokeWidth="3" />
      <circle cx="148" cy="116" r="27" fill="#fff" stroke="#f0c987" strokeWidth="3" />
      <circle cx="95" cy="119" r="16" fill={`url(#${iris})`} />
      <circle cx="145" cy="119" r="16" fill={`url(#${iris})`} />
      <circle cx="101" cy="112" r="6" fill="#fff" />
      <circle cx="151" cy="112" r="6" fill="#fff" />
      <circle cx="90" cy="125" r="2.8" fill="#fff" opacity="0.9" />
      <circle cx="140" cy="125" r="2.8" fill="#fff" opacity="0.9" />

      {/* bico */}
      <path
        d="M110 134 Q120 130 130 134 Q128 150 120 156 Q112 150 110 134 Z"
        fill="#ff7a59"
        stroke="#e0583a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M114 137 Q120 135 126 137" stroke="#ffb199" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* bochechas */}
      <ellipse cx="62" cy="144" rx="11" ry="7" fill="#ff7a59" opacity="0.35" />
      <ellipse cx="178" cy="144" rx="11" ry="7" fill="#ff7a59" opacity="0.35" />

      {/* capelo de formatura */}
      <g strokeLinejoin="round">
        <path d="M86 70 L86 88 Q120 104 154 88 L154 70 Z" fill="#1f6b3b" />
        <path d="M120 38 L186 62 L120 86 L54 62 Z" fill="#2a8a4f" stroke="#1f6b3b" strokeWidth="3" />
        <path d="M120 44 L172 62 L120 80 Z" fill="#fff" opacity="0.12" />
        <circle cx="120" cy="62" r="4.5" fill="#ffd166" />
        <path d="M120 62 L176 66 L176 96" stroke="#ffd166" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M176 96 l-5 14 h10 z" fill="#ffd166" stroke="#e0b13f" strokeWidth="2" />
      </g>
    </svg>
  );
}
