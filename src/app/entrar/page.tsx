import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Que bom te ver de novo!"
      subtitle="Entre para continuar de onde parou."
    >
      {/* useSearchParams (parâmetro ?next=) exige Suspense */}
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
