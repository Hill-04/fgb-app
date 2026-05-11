# Fase 4 — Auditoria do Módulo Live + Bridges

> Resultado da auditoria realizada antes de qualquer refactor invasivo. O módulo `src/modules/live-game/` já tem ~80% do trabalho de live scout pronto. A Fase 4 entrega 2 bridges (não rebuild).

## Surpresa principal

O módulo `live-game` é **MUITO maior** do que aparenta: 30+ arquivos com infraestrutura mature de scout FIBA. Construir do zero seria duplicação massiva e prejudicial.

## Mapa do módulo

### `src/modules/live-game/components/`
- **5 admin modes por estado de lifecycle** (paralelo perfeito com Fase 1 state machine):
  - `live-admin-pregame-mode.tsx` ↔ `LINEUP_LOCKED`
  - `live-admin-live-mode.tsx` ↔ `LIVE`
  - `live-admin-audit-mode.tsx` ↔ `ENDED`
  - `live-admin-review-mode.tsx` ↔ `UNDER_REVIEW`
  - `live-admin-report-mode.tsx` ↔ `CONFIRMED/PUBLISHED`
- `live-admin-shell.tsx` — wrapper que renderiza o mode certo
- `live-admin-mode-renderer.tsx` — dispatcher por modo
- **FIBA-styled** (`live-fiba/*`): boxscore, controls (touch buttons), event-log, scoreboard, table, team-panel
- **Public views** (`public/*`): hero, stats, box-score, play-by-play, info, overview — uma por aba pública

### `src/modules/live-game/client/`
- `live-optimistic.ts` (339 linhas) — **pattern de optimistic update**: aplica evento ao cache local imediatamente, espera reconciliation do server
- `live-reconciliation.ts` — resolve divergências entre cliente otimista e estado server

### `src/modules/live-game/services/`
- `live-game-service.ts` (1300+ linhas) — service massive com:
  - Switch statements por `eventType`: `case 'GAME_END'`, `case 'PERIOD_END'`, etc.
  - `handleReviewAction(gameId, action, userId)` aceita `'finalize-official'`
  - Linha 1247: `status: 'FINISHED'` quando `eventType === 'GAME_END'` ← **caminho legacy de fim de jogo**
  - Linha 1372: `finalizedAt: new Date()` durante finalize-official

### `src/modules/live-game/types/live-admin.ts`
- `QUICK_EVENTS` — array de 11 ações rápidas (`+2`, `+3`, `FT`, `Reb O`, `Reb D`, `AST`, `STL`, `BLK`, `TOV`, `Falta`, `Tempo`)

### `src/modules/live-game/live-fiba-config.ts`
- `LIVE_PLAYER_INLINE_ACTIONS` — 9 ações por jogador na linha de table
- `LIVE_EVENT_PRESENTATIONS` — display config por eventType (icon, tone, label)
- `getLiveControlAvailability(...)` — quais botões habilitados por contexto

## Vocabulário de eventos — divergência identificada

| Live module (legacy) | FSDEF (Fase 1, canônico) | Status |
|---|---|---|
| `SHOT_MADE_2` | `P2_MADE` | ⚠️ divergente |
| `SHOT_MADE_3` | `P3_MADE` | ⚠️ divergente |
| `SHOT_MISSED_2` | `P2_MISS` | ⚠️ divergente |
| `SHOT_MISSED_3` | `P3_MISS` | ⚠️ divergente |
| `FREE_THROW_MADE` | `FT_MADE` | ⚠️ divergente |
| `FREE_THROW_MISSED` | `FT_MISS` | ⚠️ divergente |
| `REBOUND_OFFENSIVE` | `REB_OFF` | ⚠️ divergente |
| `REBOUND_DEFENSIVE` | `REB_DEF` | ⚠️ divergente |
| `ASSIST` | `AST` | ⚠️ divergente |
| `STEAL` | `STL` | ⚠️ divergente |
| `BLOCK` | `BLK` | ⚠️ divergente |
| `TURNOVER` | `TO` | ⚠️ divergente |
| `FOUL_PERSONAL` | `F_PERS` | ⚠️ divergente |
| `FOUL_TECHNICAL` | `F_TEC` | ⚠️ divergente |
| `FOUL_UNSPORTSMANLIKE` | `F_UNS` | ⚠️ divergente |
| `TIMEOUT_CONFIRMED` | `TIM` | ⚠️ divergente |
| `PERIOD_START` | `PER_START` | ⚠️ divergente |
| `PERIOD_END` | `PER_END` | ⚠️ divergente |
| `GAME_START` | `GAME_START` | ✅ idêntico |
| `GAME_END` | `GAME_END` | ✅ idêntico |
| `HALFTIME_START` | — | ❌ sem mapping (manter legacy) |
| `HALFTIME_END` | — | ❌ sem mapping (manter legacy) |

## Fase 4 entregue

### A — Bridge file de vocabulary
`src/modules/live-game/fsdef-mapping.ts`:
- `toFsdef(legacy)` — converte legacy → FSDEF
- `toLegacy(fsdef)` — converte FSDEF → legacy
- `isIdenticalVocabulary(type)` — fast-path quando não precisa conversão
- Lista de pontos no codebase que ainda usam legacy (auditoria de migração)

### B — Bridge review API → closeGame Fase 5
`src/app/api/admin/games/[id]/review/route.ts` POST handler agora:
1. Chama legacy `LiveGameService.handleReviewAction(...)` (sem mudança)
2. **Se action é `finalize-official`**: chama `closeGame()` Fase 5 como follow-up
   - `allowParityErrors: true` (legacy já finalizou; não bloquear)
   - `reason: "Encerramento via review/finalize-official (Fase 4.B bridge)"`
3. Resposta inclui `fase5` com resultado do closeGame
4. Idempotente: se já em CONFIRMED/PUBLISHED, closeGame retorna `ok: false` sem efeito

Resultado para o admin: ao clicar **"Confirmar oficialmente"** na rota review, agora também:
- Cria `GameOfficialReportVersion v1`
- Recalcula `Standing` via `recalculateStandings`
- Gera PDF da súmula via Fase 5.C
- Grava `GameAuditLog` com `actionType: GAME_CLOSED`

## Pendências para próximas fases

### Fase 4.C — Correction chain UI
- No `LiveEventLogFiba`, mostrar visualmente `correctsEventId`/`supersededByEventId`
- Botão "corrigir lance" cria evento de correção (não UPDATE direto)

### Fase 4.D — Migração de vocabulário (breaking)
Adotar FSDEF como vocabulário interno do live module:
1. Service layer recebe legacy ou FSDEF — converte para FSDEF antes de gravar `GameEvent.eventType`
2. Renderização legacy mapeia FSDEF→legacy via `toLegacy()` enquanto componentes não migram
3. Migration de dados: backfill `GameEvent.eventType` legacy → FSDEF (idempotente)
4. Eventualmente, `live-fiba-config` + `QUICK_EVENTS` adotam FSDEF
5. Remover bridge file

### Fase 4.E — Offline queue real
O `live-optimistic.ts` já tem fundamentos. Falta:
- IndexedDB pra persistência da queue local
- Retry automático ao reconectar
- Conflict resolution UI quando server discorda

## Decisões críticas tomadas

1. **NÃO modificar `live-game-service.ts`** nesta sessão — 1300 linhas, alto risco de regressão. Bridge externa é o caminho.
2. **`allowParityErrors: true`** no bridge porque legacy já encerra primeiro — bloquear forçaria mudança comportamental do legacy.
3. **Bridge é unidirecional**: legacy → Fase 5. Não tenta sincronizar de volta. Standing e PDF passam a ser fonte da verdade. Se legacy ler `Game.status` direto, ainda vê "FINISHED".

## Documentação a manter

- Sempre que adicionar novo `case 'XXX'` em `live-game-service.ts`, atualizar `fsdef-mapping.ts` se houver equivalente FSDEF.
- Sempre que adicionar FSDEF novo em `src/lib/constants/game-events.ts`, considerar adicionar mapping legacy se o evento for produzido pelo live module.
