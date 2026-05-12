# Design Audit — FGB App (2026-05)

> **Data:** 2026-05-12
> **Escopo:** Todas as páginas de `/admin/*`, `/team/*`, e públicas (`/`, `/campeonatos`, `/jogos`, `/atletas`, etc.)
> **Referência de conformidade:** `STYLE_GUIDE.md` v7 + Web Interface Guidelines (Vercel-Labs)
> **Páginas de referência (gold standard):**
> - `src/app/admin/championships/new/page.tsx` (pós PM-06.A — wizard 2-col + tricolor)
> - `src/app/jogos/[id]/page.tsx` (hero dark + Anton clamp + tricolor)
> **Próximo passo:** este documento alimenta PM-06.C, .D, .E (implementações priorizadas).

---

## 1. Sumário Executivo

O FGB App tem **identidade visual forte e bem documentada** no `STYLE_GUIDE.md` (tricolor, Anton, clip-path CTAs, paleta de tokens) — mas **a aplicação é desigual**. Duas eras de design coexistem na mesma codebase:

| Era | Padrão | Onde está | Sentimento |
|---|---|---|---|
| **Era atual** (boa) | Tokens FGB · `fgb-display` · `.fgb-btn-primary` clip-path · tricolor · Anton em números | Wizard (PM-06.A), `jogos/[id]`, `campeonatos`, `atletas`, `selecao-gaucha`, `team/athletes`, `team/matches`, `team/financeiro`, `organization` | Editorial, prestígio, federação |
| **Era anterior** (a substituir) | `bg-orange-500/600` (cor inventada — `#FF6B00` / `#E66000`) · `slate-*`/`amber-*`/`emerald-*` (Tailwind defaults) · `rounded-2xl/3xl/[28px]` arbitrário · emojis funcionais (`🏀 🎀 ⚠️ 📍 🏆`) | `team/dashboard`, `team/championships`, `team/register`, `team/onboarding`, `team/create`, `admin/bracket`, `admin/manage`, `admin/cockpit`, `admin/cestinhas`, `admin/settings`, `admin/games/[id]/*` (público duplicado) | Genérico SaaS, foge da marca |

**~60% das páginas do team surface e ~30% do admin estão na era anterior.** Esse é o gap visual que o senhor percebeu.

### Top 5 movimentos de maior alavancagem

| # | Movimento | Esforço | Páginas impactadas | Impacto |
|---|---|---|---|---|
| 1 | **Codemod global**: substituir `#FF6B00`/`#E66000`/`bg-orange-*` → tokens FGB | S (1 PR sweep) | ~15 arquivos | ALTO — remove a cor mais conflitante |
| 2 | **Codemod CTAs**: `rounded-xl/2xl/3xl bg-[var(--amarelo)]` → `.fgb-btn-primary` | S (1 PR sweep) | ~25 ocorrências | ALTO — restaura assinatura clip-path |
| 3 | **`team/layout.tsx`** ganha `.fgb-tricolor` + `<TeamPageHeader>` compartilhado | M | 30+ páginas do team | ALTO — assinatura FGB instantânea |
| 4 | **`src/app/page.tsx`** (root) criar landing com Anton + `<CountUp>` + `<LiveRail>` | M | 1 página crítica + corrige 404 do "Início" em todo PublicHeader | ALTO — vitrine + fix de bug |
| 5 | **Wrap listagens em `<StaggerGrid>` + KPIs em `<CountUp>`** | S por página | ~12 páginas | MÉDIO — entrega "dinâmico" sem redesign |

Esses 5 movimentos resolvem a maior parte da percepção de "amontoado/estático" sem reescrever nenhuma página inteira.

### Reskin completos (era anterior → era atual)

5 páginas estão num estado tão divergente que o codemod não basta — precisam reescrita estrutural:

1. **`src/app/admin/championships/[id]/cockpit/CockpitClient.tsx`** — 100% shadcn defaults (`bg-slate-50`, `text-emerald-700`, `bg-amber-50`). Nenhum token FGB. Páginas-pivô da operação de inscrições.
2. **`src/app/admin/championships/[id]/bracket/page.tsx`** — dark theme próprio (`#141414`, `#0A0A0A`) + `#FF6B00` + `font-display` mal usado.
3. **`src/app/admin/championships/[id]/manage/page.tsx`** — dark + violet (`#8B5CF6`!) + orange. Linguagem completamente outra.
4. **`src/app/games/[id]/**`** (público) — duplica `/jogos/[id]` sem `PublicHeader`, com `rounded-[28px]`, `bg-[#111]`, `📍` emoji.
5. **`src/app/team/onboarding/page.tsx` + `team/create/page.tsx`** — FGB lockup renderizado em ORANGE (linhas 49-50 do onboarding). Primeira impressão do user.

---

## 2. Conformidade vs STYLE_GUIDE.md

Violações sistemáticas detectadas com `file:line`:

### 2.1 CTAs sem `.fgb-btn-primary` (clip-path obrigatório)

> **Regra (STYLE_GUIDE.md:66):** "Nunca use border-radius em CTAs primários."

| Arquivo | Linha | Anti-padrão |
|---|---|---|
| `team/dashboard/page.tsx` | 165, 280, 392 | `bg-[var(--amarelo)] rounded-xl/2xl/3xl` |
| `team/championships/page.tsx` | 125 | `rounded-2xl bg-[var(--amarelo)]` |
| `team/championships/[id]/register/RegistrationForm.tsx` | 335 | `rounded-xl` |
| `team/athletes/page.tsx` | 110, 116 | `rounded-xl` (Novo cadastro) |
| `admin/championships/[id]/registrations/page.tsx` | 352 | `rounded-xl bg-[var(--amarelo)] hover:bg-[#E66000]` |
| `admin/championships/[id]/settings/page.tsx` | 279 (×6 sections) | `rounded-xl bg-[var(--amarelo)] hover:bg-[#E66000]` |
| `admin/championships/[id]/scheduling/page.tsx` | 106 | `rounded-2xl` |
| `admin/championships/[id]/jogos/ChampionshipGamesPageClient.tsx` | 574, 664 | `bg-[var(--black)] rounded-xl` (Salvar modal) |
| `admin/championships/[id]/cockpit/CockpitClient.tsx` | 130-140 | `bg-emerald-600 rounded-lg` |
| `jogos/page.tsx` (público) | 184, 239 | `rounded-full` / `rounded-lg` (mixed) |

### 2.2 Cores inventadas (fora da paleta FGB)

> **Regra (STYLE_GUIDE.md:22-23):** "Tons --fgb-ink-50 → --fgb-ink-900. Substituem cinzas genéricos (slate-*, gray-*)."

**`#FF6B00` (orange-laranja inventada):**
- `admin/bracket/page.tsx` linhas 68, 71, 87, 101, 150, 153, 155
- `admin/manage/page.tsx` linhas 54, ~100
- `admin/scheduling/page.tsx` linha 81

**`#E66000` (orange-escuro hover inventado):**
- `admin/registrations/page.tsx` linha 352
- `admin/settings/page.tsx` ~6 ocorrências
- `admin/jogos/ChampionshipGamesPageClient.tsx` linha 426

**`bg-orange-*` (Tailwind default em vez de tokens):**
- `team/dashboard/page.tsx` linhas 134, 158, 180, 224, 243, 256
- `team/championships/page.tsx` linhas 35, 38, 69, 76
- `team/onboarding/page.tsx` linhas 42, 49-50, 70 (FGB lockup!)
- `admin/registrations/page.tsx` linhas 378, 410-431
- `admin/cestinhas/page.tsx` linhas 117-165 (podium)

**`bg-slate-*` / `text-slate-*` / `border-slate-*` (Tailwind default):**
- `admin/cockpit/CockpitClient.tsx` linhas 77, 185-201 (componente inteiro)
- `admin/bracket/page.tsx` múltiplas
- `admin/manage/page.tsx` múltiplas
- `jogos/page.tsx` (público) linhas 200, 203, 205, 243
- `estatisticas/page.tsx` linhas 49-50, 79-80, 121, 128, 140-151, 157
- `fgb/diretoria/page.tsx` linhas 54, 63, 67

**`bg-emerald-*` / `bg-amber-*` / `bg-blue-*` (Tailwind defaults usadas como estado semântico):**
- `admin/cockpit/CockpitClient.tsx` (toda a paleta de KPI)
- `admin/manage/page.tsx` (violeta `#8B5CF6`!)
- `admin/scheduling/page.tsx` linha 98 (badge "Beta" azul)

### 2.3 Emojis como ícones funcionais

> **Regra (STYLE_GUIDE.md, seção "Don't"):** "❌ Use emoji como ícone funcional. Use Lucide React."

- `team/dashboard/page.tsx:134,138,150,249,257` — `🏀 🎀 ♂ ♀`
- `team/championships/page.tsx:73` — `♂ ♀ ⚡`
- `team/register/page.tsx:127` — `⚠️`
- `galeria/page.tsx:66` — `🏆`
- `games/[id]/game-hero-client.tsx:256` — `📍`

### 2.4 Tipografia Anton sub-utilizada em números

> **Regra (STYLE_GUIDE.md:42):** "Anton — Títulos massivos (>26px), heros, **números de placar**"

Anton só é aplicada nos `h1` de hero. Não é usada em:
- Scores em rows de jogos (`admin/jogos/ChampionshipGamesPageClient.tsx:468` — gray pill 14px)
- KPIs do cockpit (`text-2xl font-bold` — DM Sans)
- Stats strips no hub `admin/championships/[id]/page.tsx:735` (inline `fontSize: 32` sem family)
- Standings PTS column
- Cestinhas podium scores
- Team financeiro KPI values
- Team matches counters

### 2.5 Assinatura tricolor ausente

Grep `fgb-tricolor` em `src/app/admin/` retorna **só o wizard** (após PM-06.A). Grep em `src/app/team/` retorna **zero**. Em públicas, presente em `.fgb-page-header` por default mas ausente em hubs internos.

### 2.6 Border-radius arbitrário

Valores em uso simultâneo: `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-[28px]`, `rounded-[34px]`, `rounded-[36px]`, `rounded-[40px]`, `rounded-[2.5rem]`, `rounded-[3rem]`. STYLE_GUIDE define escala `8, 12, 14, 16px`.

---

## 3. Inventário por superfície

| Superfície | Páginas | Estado dominante | Páginas críticas |
|---|---|---|---|
| **Public** | ~22 rotas | ✅ Era atual (com bolsões antigos) | `games/[id]/*`, raiz inexistente |
| **Admin** | ~19 rotas | ⚠️ Misto | `cockpit`, `bracket`, `manage` (era anterior dura) |
| **Team** | ~12 rotas | ❌ Era anterior dominante | `dashboard`, `championships`, `register`, `onboarding`, `create` |

### 3.1 Public surface (`src/app/*` fora de admin/team/api)

| Rota | Estado | Observação |
|---|---|---|
| `/` (root `page.tsx`) | ❌ NÃO EXISTE — 404 | Crítico. "Início" do `PublicHeader` quebrado em todas páginas. |
| `/campeonatos` | ✅ Best-in-class | Anton clamp, `CountUp`, `StaggerGrid`, tricolor via `.fgb-cta-pattern` |
| `/campeonatos/[id]` | ⚠️ Hero OK mas stats sem Anton (linha 193) |
| `/jogos` | ⚠️ Hero premium OK, cards com `slate-*` |
| `/jogos/[id]` | ✅ **Gold standard.** Anton 96px score, tricolor, AthleteCard |
| `/games/[id]/*` | ❌ Duplicata sem `PublicHeader`, `#111`/`#F5C200`/`bg-red-600` hardcoded |
| `/calendario` | ⚠️ Tokens OK mas flat — sem hierarquia today/weekend |
| `/atletas` | ✅ Hero dark híbrido perfeito |
| `/estatisticas` | ❌ Hero OK + leaderboard com `slate-*`/`yellow-100`/`green-100` + typo "Inidividuais" (l.36) |
| `/competicoes` | ✅ Info design forte (AlertTriangle exclusivity) |
| `/noticias` + `/portal` | ⚠️ Duplicam função — IA confusa |
| `/galeria` | ❌ `🏆` emoji como ícone (l.66), sem masonry/lightbox |
| `/fgb/diretoria` | ⚠️ `slate-*` + `#F8FAFC` (l.54,63,67) |
| `/fgb/historia`, `/fgb/fundacao` | ⚠️ Hero variant inconsistente vs guia |
| `/fgb/notas` | ⚠️ Mock data hardcoded no componente (l.11) |
| `/selecao-gaucha`, `/videos`, `/patrocinadores` | ✅ |

### 3.2 Admin surface (`src/app/admin/championships/**`)

| Rota | Estado | Observação |
|---|---|---|
| `championships/` (listing) | ⚠️ `.fgb-btn-primary` OK; chips com `rounded-full` quebram clip-path; sem hero tricolor |
| `championships/new` | ✅ **PM-06.A merged.** Referência do "como deve ser." |
| `championships/[id]` (hub) | ⚠️ Melhor admin pós-wizard; `bg-[var(--black)]` na próxima-ação + paletas Tailwind raw em pipeline (l.282-318, 453-466) |
| `[id]/cockpit` | ❌ **Reskin urgente.** 100% shadcn |
| `[id]/bracket` | ❌ **Reskin urgente.** Dark próprio + `#FF6B00` + `#8B5CF6` |
| `[id]/manage` | ❌ **Reskin urgente** (ou deprecar — função já no hub) |
| `[id]/cestinhas` | ❌ Podium com `slate-*`/`orange-*` raw + bug SSR (l.87 `window.location.href` em Server Component) |
| `[id]/standings` | ⚠️ "Classificação Premium" (?), `bg-orange-600` strip, top-3 colors raw |
| `[id]/settings` | ⚠️ Section icons `bg-orange-50` repetido 6×, salvar `rounded-xl`, wall of cards iguais |
| `[id]/registrations` | ⚠️ Tokens majoritariamente OK mas `#E66000` hover + `orange-*` em fees |
| `[id]/jogos` | ⚠️ Scores como gray pills 14px (l.468) — anti-padrão de scoreboard |
| `[id]/jogos/[gameId]` | ⚠️ Hero score em Anton (bom) mas status colors Tailwind defaults (l.17-23) |
| `[id]/scheduling` | ⚠️ Loader `#FF6B00`, badge Beta azul, CTA `rounded-2xl` |
| `[id]/organization` | ✅ Segunda melhor admin; só falta tricolor + reskin da tile "Prontidão" preta |
| `[id]/documents` | ⚠️ Stub funcional vazio (sem upload UI) |
| `[id]/arbitragem`, `[id]/matches`, `[id]/relatorios` | Redirects (sem UI) |

### 3.3 Team surface (`src/app/team/**`)

| Rota | Estado | Observação |
|---|---|---|
| `team/layout.tsx` (shell) | ⚠️ `bg-gray-50` + zero tricolor — perde brand a nível de layout |
| `team/dashboard` | ❌ Cores orange-50/200/600/700 pervasivas, `rounded-3xl` CTAs, emojis ♂♀🏀 |
| `team/championships` | ❌ CTA `rounded-2xl`, emojis gênero, empty state pobre |
| `team/championships/[id]/register` | ⚠️ Wizard estrutural OK, mas orange em todo lado + emoji + confetti `#FF6B00`/`#0B0F1E` (l.153 RegistrationForm) |
| `team/onboarding` | ❌ **FGB lockup em ORANGE** (l.49-50) — primeira impressão errada |
| `team/create` | ❌ Sem tokens, single tall form, sem branding |
| `team/athletes` | ✅ Eyebrow + display + verde CTA. Só falta clip-path |
| `team/athletes/new` | ✅ |
| `team/matches` | ✅ `fgb-display`, mas counters não em Anton CountUp |
| `team/financeiro` | ✅ `FinancePageHeader`, `FinanceKpiCard` — padrão a promover |
| `team/documents`, `team/standings`, `team/registrations`, `team/members` | Mix; alguns ainda na era anterior |

---

## 4. Padrões recorrentes (cross-surface)

### 4.1 Duas eras coexistindo (já detalhado §1)

### 4.2 Componentes que **existem mas não são usados**

Em `src/components/motion/`:
- `<CountUp>`
- `<StaggerGrid>`
- `<ScrollReveal>`

Grep retorna usos no `/campeonatos/page.tsx`. **Zero usos em `/admin/` e `/team/`.** Cada listagem (jogos, atletas, registrations, championships, cockpit table) é candidata.

Em `STYLE_GUIDE.md` há referência a `<Scoreboard>` (l.169) — cada surface re-implementa o próprio em vez de usar (3 implementações distintas: público `/jogos`, público `/games/[id]/*`, admin `/jogos/[gameId]`).

### 4.3 Estados (loading / empty / error) genéricos

Empty states geralmente são texto cinza sem CTA. Loadings são spinners default. Errors são `bg-red-50 text-red-700` sem ícone.

### 4.4 Ícones inconsistentes

Mix de Lucide React (correto) + emojis funcionais + alguns SVGs inline. Banir emojis e padronizar Lucide.

### 4.5 Anton só em hero

Anton (font Anton) é usada em `fgb-display` (titulos) mas **nunca em números de placar/stats** apesar do guia mandar. Toda KPI/score/counter está em DM Sans 24-32px — visualmente fraco para um app de basquete.

### 4.6 Spacing/density inconsistente

Cards têm paddings `p-4`, `p-5`, `p-6`, `p-8` misturados. Settings empilha 6 cards `p-8` idênticos virando wall of text. Wizard usa `px-6 sm:px-10` (responsive correto). Sem sistema consistente.

### 4.7 Mobile como afterthought

`team/championships/[id]/register/RegistrationForm.tsx` colapsa stepper labels (`lg:hidden`) mas não substitui por "Etapa 2/4" — usuário mobile fica sem orientação. `admin/standings` tem mobile cards separados mas inconsistente. Nenhum sticky toolbar mobile.

---

## 5. Oportunidades de dinamismo

A pergunta do senhor foi explícita: "**mais dinâmico e visualmente bonito**". Esses são os candidatos concretos.

### 5.1 Microinterações (Framer Motion)

- **Stagger reveal** em todas listas de cards (StaggerGrid já existe)
- **Score FLIP** em LIVE games quando placar muda (`/jogos`, `/games/[id]`, `/jogos/[id]`)
- **CountUp** em KPIs/stats no mount e em transições
- **Sticky toolbar slide-in** no cockpit quando `selectedRegIds.size > 0`
- **Pulse dot** em LIVE badges (já tem `.fgb-badge-live` mas não pulsa)
- **Tab content fade** em `<CampeonatoTabs>` ao trocar de aba
- **Modal scale+fade** em vez de hard show

### 5.2 Editorial moments (Anton)

- **Hero stat strips:** `/` root (não existe!), `/campeonatos/[id]`, `/atletas`, `/estatisticas`, `/selecao-gaucha` — todos pedem "X ATLETAS · Y CLUBES · Z CIDADES" em Anton clamp 56-96px
- **Scoreboard moments:** unificar em um `<Scoreboard variant="LIVE|SCHEDULED|FINISHED">` consumido por `/jogos`, `/jogos/[id]`, `/games/[id]/live`, hub admin
- **Stencil numbers:** podium (cestinhas), ranking (atletas), camisa (athlete cards)
- **Player of the game / atleta da semana** em `/atletas` e `/jogos/[id]`

### 5.3 Data viz

- Quarter-by-quarter mini-scoreboard em `/jogos/[id]`
- Shooting % sparklines em box score
- Radial progress em "Prontidão" (organization)
- Calendar grid em scheduling results (em vez de table)
- Capacity bar já no wizard preview — replicar em outros lugares

### 5.4 Live feel

- Live ticker no header (já existe parcial em `PublicHeader`) — promover
- `<LiveRail>` horizontal scroll de live games em `/`, `/jogos`, `/campeonatos/[id]`
- Auto-refresh em LIVE pages com indicador discreto

### 5.5 Sticky / scroll behavior

- Sticky filter bar em `/campeonatos`, `/jogos`, `/calendario`, `/atletas`, `/team/championships`
- Sticky section nav em `admin/settings` (em vez do wall de cards)
- Scroll-spy sidebar em `admin/championships/[id]` (hub)
- Wizard de criação já tem sticky preview — replicar em `admin/settings` e `admin/championships/[id]`

---

## 6. Roadmap proposto (PM-06.C → ...)

Ordenado por **alavancagem (impacto / esforço)**. Cada PM é mergeável independentemente.

### PM-06.C — Codemod global de cores e CTAs (~1 dia)

**Esforço:** S
**Impacto:** ALTO

- Substituir `#FF6B00` → `var(--fgb-yellow-500)` (todas ocorrências)
- Substituir `#E66000` → `var(--fgb-yellow-700)` (hover)
- Substituir `bg-orange-{50,100,200,300,400,500,600,700}` → tokens FGB equivalentes (yellow para CTA/progresso, green para sucesso, red para erro)
- Substituir `bg-slate-*`/`text-slate-*`/`border-slate-*` → `bg-[var(--fgb-ink-*)]` etc.
- Substituir `bg-emerald-*`/`bg-amber-*`/`bg-blue-*` em estados semânticos → tokens
- Substituir `rounded-xl bg-[var(--amarelo)]` / `rounded-2xl bg-[var(--amarelo)]` etc. → `.fgb-btn-primary`
- Adicionar regra ESLint banindo `slate-*`, `emerald-*`, `amber-*`, hex hardcoded em styles
- Remover todos os emojis funcionais → Lucide

**Arquivos:** ~25 arquivos modificados, todos sweeps mecânicos. Testar visualmente cada superfície depois.

### PM-06.D — Team shell + página root (~1.5 dia)

**Esforço:** M
**Impacto:** ALTO

- Criar `src/app/page.tsx` (root) — Anton hero "BASQUETE GAÚCHO" + `<CountUp>` de atletas/clubes/cidades + `<LiveRail>` de jogos hoje + tricolor
- Adicionar `<TeamPageHeader>` compartilhado (modelo: `FinancePageHeader`) com props `eyebrow | title | description | badge | actions`
- Adicionar `.fgb-tricolor` 4px no `team/layout.tsx` (acima do `<main>`)
- Trocar `bg-gray-50` do team layout → `bg-[var(--fgb-ink-50)]`
- Migrar `team/dashboard`, `team/championships`, `team/registrations`, `team/documents`, `team/standings` pro `<TeamPageHeader>` compartilhado

**Resultado:** 30 páginas do team ganham assinatura tricolor + header consistente sem trabalho per-page.

### PM-06.E — `<Scoreboard>` canônico + resolução `/games/[id]` (~1 dia)

**Esforço:** M
**Impacto:** ALTO

- Criar `<Scoreboard>` em `src/components/Scoreboard.tsx` com variantes `LIVE`/`SCHEDULED`/`FINISHED` — Anton 64-96px, tricolor stripe top, pulse no LIVE
- Substituir implementações em `/jogos/page.tsx` (cards), `/jogos/[id]/page.tsx` (hero), `admin/jogos/ChampionshipGamesPageClient.tsx` (rows)
- Redirect `/games/[id]/*` → `/jogos/[id]/*` (mesmo padrão do `championships` → `campeonatos`)
- Deletar `src/app/games/[id]/*` ou refactorar pra consumir o shell institucional

**Resultado:** elimina ~200 linhas de drift, fixa duplicação de rota, eleva todos momentos de placar.

### PM-06.F — Motion + CountUp em listings e KPIs (~1 dia)

**Esforço:** S
**Impacto:** MÉDIO-ALTO

- Wrap toda `<X.map(...)>` que renderiza cards em `<StaggerGrid stagger={0.05-0.08}>`: `/campeonatos`, `/jogos`, `/atletas`, `/team/championships`, `/team/athletes`, `/admin/championships`, `cockpit table`, `standings`, `cestinhas`
- Wrap todos KPI values em `<CountUp>`: `team/financeiro`, `team/matches`, `team/dashboard` StatCards, `admin/championships/[id]` hub stats, `cockpit KPICard`, `organization stats`, `/atletas` e `/selecao-gaucha` hero stats
- Adicionar `<ScrollReveal>` em hero sections que rolam in (root, championships/[id], atletas)

**Resultado:** o "feeling dinâmico" que o senhor pediu, sem reescrever página alguma.

### PM-06.G — Reskin `cockpit/CockpitClient.tsx` (~2 dias)

**Esforço:** L
**Impacto:** ALTO

- Substituir root container, KPI cards, table styling, bulk action toolbar
- Sticky bulk-action toolbar com Framer Motion slide-in
- Anton 40-56px em KPI values, tricolor accent left edge em KPI cards
- `.fgb-btn-primary` clip-path em CTAs

### PM-06.H — Reskin `admin/bracket` + decisão sobre `admin/manage` (~1.5 dia)

**Esforço:** M
**Impacto:** MÉDIO (páginas menos acessadas, mas hoje constrangedoras)

- `bracket`: branco + verde-50 groups + tricolor por categoria + Anton round titles + `.fgb-badge-live` na final
- `manage`: deprecar (função já no hub) OU rebuild matching hub style. Decisão arquitetural.

### PM-06.I — `team/onboarding` + `team/create` premium (~1.5 dia)

**Esforço:** M
**Impacto:** ALTO (primeira impressão do usuário team)

- Onboarding: hero `.fgb-page-header-premium` com Anton "BEM-VINDO", tricolor, animação de entrada
- Create: converter em wizard 2-step (Equipe → Ginásio), espelhando o championship wizard pós-PM-06.A

### PM-06.J — Hub admin reskin + stats scoreboard (~2 dias)

**Esforço:** L
**Impacto:** ALTO

- `admin/championships/[id]/page.tsx` (hub): hero premium verde-800 com Anton, tricolor stripe, stat strip Anton 56px abaixo do hero
- Pipeline steps: tokens FGB no lugar das raws
- "Próxima ação" → `.fgb-btn-primary` em card verde, não preto

### PM-06.K — Admin settings 2-col sticky (~1 dia)

**Esforço:** M
**Impacto:** MÉDIO

- `admin/championships/[id]/settings`: refazer como layout 2-col com scroll-spy nav à esquerda + content à direita, espelhando wizard
- Salvar fica sticky no rodapé de cada seção
- Section headers: eyebrow + Anton + tricolor underline

### Backlog (priorizar depois)

- `cestinhas`: podium scoreboard com Anton + StaggerGrid
- `standings`: Anton em PTS + animação rank up/down
- `documents`: drag-drop drawer real
- `scheduling`: AI hero moment + calendar grid de resultados
- `estatisticas`: rebuild leaderboard com Anton 96px + stencil rank ghost
- `galeria`: mosaic + lightbox
- `noticias` vs `portal`: decisão IA + magazine layout
- Filter chip system canônico (`/campeonatos`, `/jogos`, `/atletas`, `/calendario`, `/noticias`, `/notas`)

---

## 7. Apêndice — Padrões a banir / a usar

### 7.1 A banir (ESLint candidates)

```
className contains: "slate-", "emerald-", "amber-", "violet-", "fuchsia-"
className contains: "bg-orange-" (use --fgb-yellow-*)
className matches: rounded-(xl|2xl|3xl|\[) com bg-[var(--amarelo)] (use .fgb-btn-primary)
content matches: emoji unicode em ícones funcionais
inline style: fontSize >= 24 sem fontFamily 'var(--font-anton)' em valores numéricos
hardcoded hex: #FF6B00, #E66000, #111, #111111, #0A0A0A, #8B5CF6
```

### 7.2 A usar (cheatsheet)

| Preciso de... | Use |
|---|---|
| CTA primário | `<button className="fgb-btn-primary">` (yellow + clip-path) |
| CTA secundário | `<button className="fgb-btn-secondary">` (outline) |
| Hero página padrão | `<div className="fgb-page-header">` |
| Hero página premium | `<div className="fgb-page-header-premium">` |
| Big number / score | `style={{ fontFamily: 'var(--font-anton)', fontSize: 56 }}` |
| Label uppercase | `<span className="fgb-label">` |
| Tricolor stripe | `<div className="fgb-tricolor" style={{ height: 3 }} aria-hidden />` |
| Animar entrada de cards | `<StaggerGrid stagger={0.06}>` |
| Animar number reveal | `<CountUp end={n} />` |
| Animar hero em viewport | `<ScrollReveal>` |
| Cor de sucesso | `var(--fgb-green-700)` ou `--fgb-green-50` bg |
| Cor de atenção/progresso | `var(--fgb-yellow-500)` |
| Cor de erro/live | `var(--fgb-red-500)` |
| Tom neutro | `var(--fgb-ink-{50..900})` (NUNCA `slate-*` ou `gray-*`) |

### 7.3 Web Interface Guidelines — issues também aplicáveis

Da varredura contra https://github.com/vercel-labs/web-interface-guidelines:

- Vários `<button>` icon-only sem `aria-label` (ex: ChevronUp/Down toggle do wizard pré PM-06.A — corrigido com `aria-expanded`)
- Modais sem `overscroll-behavior: contain`
- `<select>` nativos sem `background-color`/`color` explícitos (perigo em dark mode)
- Reticências `...` em vez de `…` em strings ("Carregando...", "Salvando...")
- `transition: all` em vez de propriedades específicas
- Loading states sem `aria-live="polite"`

Recomendação: criar PM-06.X dedicado a accessibility/polish após reskin estético.

---

## 8. Próximos passos

1. **Senhor lê este doc** e me dá sinal sobre quais PMs entrar primeiro (recomendo .C → .D → .F → .E)
2. **Eu abro PR pra mergear este doc em main** (PM-06.B)
3. **Iniciamos PM-06.C** (codemod global) — entrega rápida que muda a percepção em todas páginas

---

*Audit gerado por análise página-a-página de 3 surfaces (admin/public/team) com lente das skills `frontend-design` + `web-design-guidelines`. Padrões cross-cutting validados em 3 passes paralelos.*
