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

## Anki

Rotas em `/anki`: baralhos, `/anki/cartoes` (buscar, editar, mover, suspender e ações em lote),
`/anki/estatisticas`, `/anki/importar` (importar e exportar) e a sessão de estudo.

- Gráficos em `src/components/charts` (SVG próprio, sem biblioteca): colunas de até 24px com topo arredondado, grade
  discreta, dica por mouse e teclado (setas), versão em tabela e rótulo só no pico. As cores categóricas
  (`--viz-1..5`) foram validadas com o `validate_palette.js` do dataviz nos dois temas; no tema claro, aqua, amarelo e
  magenta ficam abaixo de 3:1 de contraste, então a legenda sempre mostra os números (regra de alívio).
- Downloads de exportação são links `<a download>` para `/api/anki/export/*`: o navegador baixa com o cookie de sessão.
