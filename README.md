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
- **Painel (`/painel`):** saudação por horário e uma frase sobre o dia (XP/streak); cartão da trilha (próxima lição e barra do nível), sequência da semana, cartão do Anki (cartões para hoje, só baralhos raiz, com "Estudar agora" no baralho com mais pendências), cartão de leitura (livro em andamento) e atalhos. Anki e livros carregam em `Suspense` próprios, então a página abre sem esperar por eles. A lógica fica em `src/lib/dashboard.ts` (com testes).
- **Celular:** todas as telas foram revisadas em 375 px; o menu principal marca a seção atual e rola na horizontal, e a barra do leitor cabe em duas linhas (o tema vira um botão que alterna).
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

### Estudo (`/anki/estudar/[baralho]`)

- **Modo foco:** sem o cabeçalho do site (layout próprio dentro do grupo de rotas `anki/(painel)`), com barra de **progresso da sessão**, contadores Novos/Aprender/Revisar e o tipo do cartão atual.
- Toque no cartão (ou `Espaço`/`Enter`) para ver a resposta; ações **fixas embaixo**, na altura do polegar: Errei · Difícil · Bom · Fácil com o intervalo e a tecla (1–4). Em cartões de lacuna, a frase completa substitui a que tinha o buraco.
- No fim, resumo da sessão: cartões, % sem errar e tempo (`src/lib/study-stats.ts`, com testes).

## Biblioteca

- `/biblioteca`: estante com filtro por nível, busca e "Continue lendo". `/biblioteca/[id]`: leitor com **pdf.js**
  (página nítida em canvas, camada de texto selecionável, zoom, temas claro/sépia/escuro, atalhos ← → e retomada da página).
- `/admin/livros` (só admin): lê o PDF no navegador (nº de páginas e capa da 1ª página), envia **direto ao bucket** com
  barra de progresso e pede a confirmação ao backend.
- Os recursos do pdf.js (fontes, CMaps, WASM) são copiados para `public/pdfjs` por `scripts/copy-pdfjs-assets.mjs`
  (`postinstall` e `prebuild`); a pasta não é versionada.

### Leitor → Anki

- Clique numa palavra (ou selecione uma expressão de até 8 palavras) no leitor: o popup mostra pronúncia, tradução em destaque, a **frase do livro** com a palavra marcada e as definições (recolhidas, com "mais definições"); o botão **Adicionar ao Anki** fica num rodapé fixo, sempre à vista; `Enter` adiciona. A palavra marcada (Custom Highlight API, sem mexer no DOM do pdf.js). No celular vira uma folha na parte de baixo; `Esc`, rolagem, troca de página, zoom e clique fora fecham.
- **Adicionar ao Anki:** cartão de *Palavra* (frente = palavra, verso = tradução) ou de *Lacuna na frase* (`{{c1::palavra}}`); a frase e `📖 Livro · p. N` vão no campo extra.
  O baralho padrão é `Livros › Título do livro`, criado sozinho; a escolha de tipo e baralho fica lembrada. Avisa se você já tem um cartão da palavra.
- Achar a palavra e a frase (`src/lib/reading-context.ts`) e montar o cartão (`src/lib/word-cards.ts`) são funções puras com testes: `pnpm test`.

## Trilha de aulas

- `/trilha`: um nível por vez. No topo, o cartão **Continuar** (a próxima lição, com unidade e posição) ao lado da faixa de **streak / XP / últimos 7 dias**; abaixo, abas **A1…C2** (links `?nivel=a2`, fixas ao rolar, com andamento de cada nível) e, no nível escolhido, as unidades com **cartões de lição** (estrelas, XP, "Próxima"). Níveis sem lições mostram "em breve". A lógica (resumo por nível, nível padrão, status da unidade) está em `src/lib/trail-view.ts`, com testes.
- `/aprender/[nível]/[unidade]/[lição]`: tela cheia, um exercício por vez, com atalhos (`1`–`6` escolhem, `Enter` verifica e continua). O que você erra **volta no fim** da fila até acertar (a nota só considera a primeira resposta, corrigida no servidor).
- Perguntas de **leitura** (`Leia: “texto” pergunta`) aparecem com o texto num cartão próprio, com botão de ouvir.
- Cinco tipos de exercício: múltipla escolha (com áudio), lacuna (tocar ou digitar), montar a frase, tradução e ditado (usa a voz do navegador, normal e devagar).
- **Explicação antes dos exercícios:** na primeira vez (lição ainda sem nota), a tela de **estudo** abre sozinha, com seções, tabelas, exemplos com 🔊, 💡 dicas e ⚠️ cuidados, e o botão "Começar os exercícios". Durante a lição, o botão **📖 Explicação** reabre o texto por cima, sem perder a resposta em andamento. Componentes em `src/components/trail/study-view.tsx`; o texto aceita **negrito** (`src/lib/rich-text.ts`).
- Ao concluir: estrelas, XP, streak, o cartão **Para fixar** (dicas da lição), "Rever a explicação" e as **palavras da lição**, com um botão que cria os cartões no Anki (`Trilha › A1 › Unidade`).
- O fluxo da fila (`src/lib/lesson-flow.ts`) e a montagem dos cartões de vocabulário (`src/lib/lesson-vocab.ts`) são funções puras com testes (`pnpm test`).

### Teste de nível

- `/nivelamento`: 30 perguntas de A1 a C1, uma por vez, **sem correção no meio** e com "Não sei" (conta como errada, mas evita chute). No fim mostra o nível em que começar e os acertos por nível; dá para refazer.
- Na trilha: convite ao teste para quem ainda não fez, selo "Seu nível" (com aviso se ainda não há lições ali) e "Você começa aqui" no título do nível. O botão "Continuar" respeita o nível.

## Meta de estudo (`/meta`)

- O aluno escolhe o **nível** que quer alcançar (B2 vem como recomendado para trabalhar no exterior), o **prazo** (atalhos de 6 meses a 2 anos ou uma data) e, se quiser, o **objetivo em palavras**. A tela mostra a conta ao vivo: horas de estudo necessárias e minutos por dia e por semana.
- Com a meta criada: barra de progresso com o **marcador do prazo** (quanto do tempo já passou), dias que faltam, horas que faltam, meta de hoje, status (adiantado, no ritmo, dá para recuperar, prazo vencido, concluída), gráfico dos **últimos 14 dias**, de onde vem o estudo (lições, Anki, leitura, entrevistas, diário, treinos marcados no checklist, fora da plataforma) e um formulário para **registrar estudo feito fora** da plataforma.
- O painel (`/painel`) mostra a meta em um card, ou o convite para criar uma.
- As contas de formatação ficam em `src/lib/goal-format.ts` (com testes); a conta do plano é do servidor.

## Preparação para entrevista (`/entrevista`)

- **46 perguntas** de entrevista de dev em 10 categorias (JavaScript, TypeScript, React, backend, bancos de dados, APIs, Git e DevOps, testes, arquitetura e comportamental), com filtro por categoria e dificuldade e o progresso de cada uma.
- Na pergunta: o aluno escreve a resposta **em inglês** (contador de palavras, frases úteis para começar) e recebe o feedback: nota técnica de 1 a 5, nível do inglês, **erros marcados no próprio texto** com a correção e a explicação em português, pontos fortes, imprecisões, o que uma boa resposta cobre e uma **versão melhorada** (com áudio). A resposta de exemplo fica escondida até o aluno pedir.
- Sem a chave da IA no servidor, o feedback vira uma **revisão simples** por palavras-chave (e a tela avisa). Cada tentativa fica guardada no histórico da pergunta.

## Hoje: checklist diário (`/hoje`)

- O checklist do dia, com anel de progresso, a sequência de **dias completos** e a conta "X de Y feitos". Itens padrão: lição da trilha, Anki, leitura, diário e entrevista (**marcados sozinhos** quando o aluno faz a atividade na plataforma, com o progresso: "3 de 5 min lidos") e listening e falar em voz alta (**manuais**, com a pergunta opcional "quantos minutos?", que entra na meta de estudo).
- Qualquer item pode ser marcado à mão (por exemplo, o Anki feito no celular). O aluno **personaliza** o checklist: liga e desliga itens, cria até 10 próprios, renomeia, apaga e reordena.
- Calendário do mês colorido pelo quanto foi feito em cada dia e atalho para a meta. O painel (`/painel`) ganhou o card "Checklist de hoje" ao lado da meta, e o menu, os links **Hoje** e **Diário**.
- Os formatadores (mês, detalhe de cada item, mensagem do dia) ficam em `src/lib/checklist-format.ts`, com testes.

## Diário em inglês (`/diario`)

- **Editor do dia:** textarea em inglês com contador de palavras (ideal de 50 a 150), humor em emoji e **tema do dia** sugerido (rotativo, pela faixa de nível do aluno) com áudio. Uma entrada por dia; dá para escrever hoje e preencher os **7 dias anteriores** (`/diario/AAAA-MM-DD`).
- **Rascunho no navegador:** o que o aluno digita é guardado no `localStorage` e volta se a aba fechar antes de salvar. O tempo escrevendo (sem contar pausas longas) vai para a meta.
- **Corrigir meu texto:** sob demanda, salva e pede a correção: nível estimado, **erros marcados no próprio texto** com a explicação em português, pontos fortes, versão mais natural (com áudio) e uma dica. Sem a IA no servidor, vale uma **revisão simples** (e a tela avisa). Se o texto mudar depois, a correção aparece como desatualizada.
- **Histórico** (`/diario/historico`): calendário do mês com os dias escritos, lista das entradas, **busca** por texto, estatísticas (sequência, entradas, palavras, média) e **exportação** de tudo em `.md`. O diário é privado.
- Os formatadores e o calendário ficam em `src/lib/diary-format.ts`, com testes.

## Motivação (`/motivacao`)

- O **mural pessoal** do aluno (privado): frases, imagens, vídeos do YouTube pelo link e **áudios gravados pelo próprio aluno**, para ouvir nos dias difíceis.
- **Me motive agora:** um item aleatório em destaque e o botão "Outro" (o mesmo sorteio aparece no card "Seu motivo para continuar" do painel).
- **Adicionar** (abas): *Frase* (até 500 caracteres, autor opcional); *Imagem* (JPG, PNG, WebP ou GIF até 5 MB; as grandes são reduzidas no navegador para 1600 px); *Vídeo* (links `watch`, `youtu.be`, `shorts`, `embed`, com prévia; o player `youtube-nocookie.com` só carrega ao clicar); *Áudio* (**gravador** com microfone: pausar, parar, até 5 min, ouvir antes de salvar; ou envio de arquivo até 15 MB).
- **Mural:** filtros (frases, imagens, vídeos, áudios, favoritos), imagem ampliada ao clicar, favoritar, editar e apagar (com confirmação).
- O gravador usa `MediaRecorder` e escolhe o formato que o navegador suporta (`src/lib/motivation-format.ts`, `pickAudioMime`): WebM/Opus no Chrome e no Firefox, MP4 no Safari. O microfone exige HTTPS (ou `localhost`) e a permissão do navegador; sem isso a aba explica e oferece o envio de arquivo.
- O envio de imagem e áudio vai direto ao bucket (`src/lib/motivation-upload.ts` e `src/lib/bucket-upload.ts`, o mesmo POST pré-assinado dos livros).
