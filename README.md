# English Lab — Web (Next.js 16)

Interface da plataforma de estudos de inglês. Fala com o backend NestJS (`../backend`).

## Rodando localmente

```bash
cp .env.example .env.local
pnpm install
pnpm dev                    # http://localhost:3000
```

O navegador chama só o Next: `/api/*` é encaminhado (rewrite) para `API_URL`, então os
cookies de sessão ficam na mesma origem. Suba o backend antes para ver o status da API no rodapé.

## Design system

Tokens em `src/app/globals.css` (paleta quente, tema claro/escuro automático).
Componentes base em `src/components/ui` (`Button`, `Card`, `Progress`) e o mascote em
`src/components/mascot.tsx`.

> `cacheComponents` está ligado: dados dinâmicos precisam ficar dentro de `<Suspense>`.

## Autenticação

- `src/proxy.ts` protege `/painel` e redireciona logados para fora de `/entrar` e `/cadastrar`.
- O refresh token só trafega em `/api/auth/*` (`Path=/api/auth`). Quando o access token expira, o proxy
  manda a navegação por `src/app/api/auth/session/route.ts`, que renova a sessão e volta para a página.
- Server Components leem o usuário com `getCurrentUser()` (`src/lib/session.ts`), sempre dentro de `<Suspense>`.
