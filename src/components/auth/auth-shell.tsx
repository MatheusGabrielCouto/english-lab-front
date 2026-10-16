import Link from "next/link";
import type { ReactNode } from "react";
import { Mascot } from "@/components/mascot";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Link
        href="/"
        className="mb-24 flex items-center justify-center gap-3 font-display text-2xl font-semibold"
      >
        <span className="grid size-10 place-items-center rounded-2xl bg-butter text-xl text-ink shadow-[0_3px_0_0_var(--color-butter-edge)]">
          E
        </span>
        English Lab
      </Link>

      <Card className="relative p-7">
        <div className="mx-auto -mt-24 mb-2 w-28 text-foreground">
          <Mascot />
        </div>
        <h1 className="text-center font-display text-3xl font-semibold text-balance">
          {title}
        </h1>
        <p className="mb-6 mt-2 text-center text-muted text-pretty">{subtitle}</p>
        {children}
      </Card>
    </main>
  );
}
