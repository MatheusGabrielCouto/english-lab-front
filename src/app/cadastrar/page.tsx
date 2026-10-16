import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Vamos começar?"
      subtitle="Crie sua conta e comece pelo seu nível, no seu ritmo."
    >
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
