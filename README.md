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

## Biblioteca

- `/biblioteca`: estante com filtro por nível, busca e "Continue lendo". `/biblioteca/[id]`: leitor com **pdf.js**
  (página nítida em canvas, camada de texto selecionável, zoom, temas claro/sépia/escuro, atalhos ← → e retomada da página).
- `/admin/livros` (só admin): lê o PDF no navegador (nº de páginas e capa da 1ª página), envia **direto ao bucket** com
  barra de progresso e pede a confirmação ao backend.
- Os recursos do pdf.js (fontes, CMaps, WASM) são copiados para `public/pdfjs` por `scripts/copy-pdfjs-assets.mjs`
  (`postinstall` e `prebuild`); a pasta não é versionada.

### Leitor → Anki

- Clique numa palavra (ou selecione uma expressão de até 8 palavras) no leitor: o popup mostra pronúncia, tradução, definições e a **frase do livro**
  com a palavra destacada (Custom Highlight API, sem mexer no DOM do pdf.js). No celular vira uma folha na parte de baixo; `Esc`, rolagem, troca de página, zoom e clique fora fecham.
- **Adicionar ao Anki:** cartão de *Palavra* (frente = palavra, verso = tradução) ou de *Lacuna na frase* (`{{c1::palavra}}`); a frase e `📖 Livro · p. N` vão no campo extra.
  O baralho padrão é `Livros › Título do livro`, criado sozinho; a escolha de tipo e baralho fica lembrada. Avisa se você já tem um cartão da palavra.
- Achar a palavra e a frase (`src/lib/reading-context.ts`) e montar o cartão (`src/lib/word-cards.ts`) são funções puras com testes: `pnpm test`.

## Trilha de aulas

- `/trilha`: um nível por vez. No topo, o cartão **Continuar** (a próxima lição, com unidade e posição) ao lado da faixa de **streak / XP / últimos 7 dias**; abaixo, abas **A1…C2** (links `?nivel=a2`, fixas ao rolar, com andamento de cada nível) e, no nível escolhido, as unidades com **cartões de lição** (estrelas, XP, "Próxima"). Níveis sem lições mostram "em breve". A lógica (resumo por nível, nível padrão, status da unidade) está em `src/lib/trail-view.ts`, com testes.
- `/aprender/[nível]/[unidade]/[lição]`: tela cheia, um exercício por vez, com atalhos (`1`–`6` escolhem, `Enter` verifica e continua). O que você erra **volta no fim** da fila até acertar (a nota só considera a primeira resposta, corrigida no servidor).
- Perguntas de **leitura** (`Leia: “texto” pergunta`) aparecem com o texto num cartão próprio, com botão de ouvir.
- Cinco tipos de exercício: múltipla escolha (com áudio), lacuna (tocar ou digitar), montar a frase, tradução e ditado (usa a voz do navegador, normal e devagar).
- Ao concluir: estrelas, XP, streak e as **palavras da lição**, com um botão que cria os cartões no Anki (`Trilha › A1 › Unidade`).
- O fluxo da fila (`src/lib/lesson-flow.ts`) e a montagem dos cartões de vocabulário (`src/lib/lesson-vocab.ts`) são funções puras com testes (`pnpm test`).

### Teste de nível

- `/nivelamento`: 30 perguntas de A1 a C1, uma por vez, **sem correção no meio** e com "Não sei" (conta como errada, mas evita chute). No fim mostra o nível em que começar e os acertos por nível; dá para refazer.
- Na trilha: convite ao teste para quem ainda não fez, selo "Seu nível" (com aviso se ainda não há lições ali) e "Você começa aqui" no título do nível. O botão "Continuar" respeita o nível.
