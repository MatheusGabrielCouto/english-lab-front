"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { safeNextPath } from "@/lib/auth-paths";

type Mode = "login" | "register";

type ApiError = {
  message?: string;
  errors?: { field: string; message: string }[];
};

const copy = {
  login: {
    submit: "Entrar",
    pending: "Entrando…",
    endpoint: "/api/auth/login",
    switchText: "Ainda não tem conta?",
    switchLink: "Criar conta",
    switchHref: "/cadastrar",
  },
  register: {
    submit: "Criar minha conta",
    pending: "Criando conta…",
    endpoint: "/api/auth/register",
    switchText: "Já tem conta?",
    switchLink: "Entrar",
    switchHref: "/entrar",
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const text = copy[mode];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(undefined);
    setFieldErrors({});

    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const res = await fetch(text.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.replace(next);
        router.refresh();
        return;
      }

      const body = (await res.json().catch(() => ({}))) as ApiError;
      if (res.status === 400 && body.errors?.length) {
        setFieldErrors(
          Object.fromEntries(body.errors.map((e) => [e.field, e.message])),
        );
      } else if (res.status === 429) {
        setFormError("Muitas tentativas. Aguarde um minutinho e tente de novo.");
      } else {
        setFormError(body.message ?? "Algo deu errado. Tente novamente.");
      }
    } catch {
      setFormError("Não consegui falar com o servidor. Confira sua conexão.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {mode === "register" && (
        <Field
          id="name"
          name="name"
          label="Como podemos te chamar?"
          autoComplete="name"
          required
          error={fieldErrors.name}
        />
      )}
      <Field
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        inputMode="email"
        required
        error={fieldErrors.email}
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Senha"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required
        hint={mode === "register" ? "Pelo menos 8 caracteres." : undefined}
        error={fieldErrors.password}
      />

      <p role="alert" className="min-h-5 text-sm font-semibold text-coral-edge">
        {formError}
      </p>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? text.pending : text.submit}
      </Button>

      <p className="text-center text-muted">
        {text.switchText}{" "}
        <Link
          href={
            next === "/painel"
              ? text.switchHref
              : `${text.switchHref}?next=${encodeURIComponent(next)}`
          }
          className="font-bold text-primary underline-offset-4 hover:underline"
        >
          {text.switchLink}
        </Link>
      </p>
    </form>
  );
}
