# Fase 1 — Foundation: Imutabilidade + State Machine

> **Status:** PROPOSTA — não aplicada. Aguarda revisão antes da migration ir pro DB.

## A. Princípios

1. **Additive only** — sem `DROP`, sem `RENAME`. Toda mudança é nova coluna/tabela com default seguro.
2. **Backwards compatible** — código atual continua funcionando. Campos existentes ficam.
3. **Backfill explícito** — script separado da migration de schema, para popular novas colunas a partir dos dados atuais.
4. **State machine na camada de aplicação primeiro** — guarda em service layer. DB constraint (trigger SQL) é opcional, virá numa Fase 1.5 se necessário.
5. **Imutabilidade tem 2 camadas**:
   - **Soft (aplicação)**: serviços rejeitam mutação em `Game` com `lifecycleState IN (CONFIRMED, PUBLISHED)`.
   - **Hard (DB)**: Postgres trigger ou row-level security — fase opcional posterior.

## B. Estado atual (achados do schema)

| Já temos | Onde |
|---|---|
| `Game.status` (String) + `Game.liveStatus` (String) — 2 eixos sobrepostos | line 417-418 |
| `Game.isLivePublished` (Boolean) | line 425 |
| `GameLiveSession` com `status`, `publicVisibilityStatus`, `clockStatus`, openedBy/closedBy | line 459 |
| `GameRoster.isLocked` (Boolean) — lineup lock já modelado | line 485 |
| `GameRosterPlayer` com `isStarter`, `isCaptain`, `isAvailable`, `isOnCourt`, `isDisqualified` | line 496 |
| `GameEvent` com `sequenceNumber`, `period`, `clockTime`, `eventType`, `isCancelled`, `isReverted`, `correctionReason` | line 531 |
| `GamePlayerStatLine` e `GameTeamStatLine` — projeções de stats | line 565, 608 |
| `GamePeriodScore` — pontuação por quarto | line 634 |
| `GameOfficialReport` (1:1 com Game) com `officialPdfUrl`, `boxScoreJson`, `playByPlayJson`, `signedOffByUserId`, `finalizedAt` | line 648 |
| `GameAuditLog` — auditoria por jogo | line 663 |
| `Athlete.situation` (PENDING/ACTIVE), `activatedAt`, `activatedBy`, `bidPublishedAt`, `bidNumber` | line 698 |
| `AthleteRegistrationAuditLog` — auditoria de inscrição | line 852 |

**Conclusão:** o schema já está 85% pronto. Faltam **5 ajustes pontuais** + **camada de service para enforcement**.

## C. Gaps identificados (motivam a migration)

### Gap 1 — Sem state machine unificada
`Game.status` (SCHEDULED/ONGOING/FINISHED/CANCELLED/POSTPONED) e `Game.liveStatus` (PRE_GAME_READY/LIVE/HALFTIME/PERIOD_BREAK) se sobrepõem. Não há um valor único de verdade para "que fase do ciclo de vida o jogo está".

### Gap 2 — Atleta "verificado FGB" não é explícito
`Athlete.situation = 'ACTIVE'` + `bidNumber IS NOT NULL` indica indiretamente que o atleta foi aprovado, mas não há flag explícita `verified` que a UI possa consumir consistentemente para mostrar o badge ✓.

### Gap 3 — GameEvent sem ponteiro para evento corretor
`isCancelled`/`isReverted` invalida um evento, mas não aponta para o **evento que o substituiu**. Para audit completo (FIBA pattern), correção precisa registrar `correctsEventId` (qual evento estamos corrigindo) e `supersededByEventId` (qual evento nos invalidou).

### Gap 4 — GameOfficialReport é singular (1:1)
Após `CONFIRMED`, se houver correção via revisão, geramos `v2`. Hoje o modelo só guarda 1 report. Precisamos versionamento.

### Gap 5 — Sem enum/contract para eventType
`GameEvent.eventType String` aceita qualquer valor. Sem enum, é impossível garantir consistência entre features. FIBA define vocabulário canônico (FSDEF).

## D. Proposta — 5 migrations aditivas

### Migration 1 — `Game.lifecycleState` (consolidação)

```prisma
model Game {
  // ...existing fields...
  lifecycleState     String   @default("SCHEDULED")
  lifecycleVersion   Int      @default(0)
  // ...
  @@index([lifecycleState])
}
```

**Valores permitidos** (enforcement em service, não DB):
- `DRAFT` — jogo criado, ainda em rascunho
- `SCHEDULED` — agendado, aceita alteração de data/local/escalas
- `LINEUP_LOCKED` — pre-jogo confirmado: rosters travados, escala árbitros confirmada, atletas verificados. Não aceita troca de lineup sem `UNDER_REVIEW`
- `LIVE` — jogo em andamento, recebendo `GameEvent`s
- `ENDED` — fim de jogo natural (sirene final ou término forçado), aguardando validação de paridade
- `CONFIRMED` — paridade validada, súmula gerada (`GameOfficialReport.finalizedAt` setado), aceita publicação
- `PUBLISHED` — público pode ver, propagou stats para `AthleteCareerStats`, `Standing`, ranking. **Imutável por default.**
- `UNDER_REVIEW` — alguém solicitou revisão pós-publicação (árbitro federativo, ouvidoria). Permite criar correção SEM perder histórico.
- `CANCELLED` — jogo cancelado (W.O., decisão CBB, etc.)
- `POSTPONED` — adiado para nova data

**Backfill script** (rodado uma vez após a migration aplicar):
```typescript
// scripts/backfill-lifecycle-state.ts
import { prisma } from '@/lib/db'

async function backfill() {
  const games = await prisma.game.findMany({ select: { id: true, status: true, liveStatus: true, isLivePublished: true } })
  for (const g of games) {
    let state = 'SCHEDULED'
    if (g.status === 'CANCELLED') state = 'CANCELLED'
    else if (g.status === 'POSTPONED') state = 'POSTPONED'
    else if (g.status === 'FINISHED' && g.isLivePublished) state = 'PUBLISHED'
    else if (g.status === 'FINISHED') state = 'CONFIRMED'
    else if (g.liveStatus === 'LIVE' || g.liveStatus === 'HALFTIME' || g.liveStatus === 'PERIOD_BREAK') state = 'LIVE'
    else if (g.liveStatus === 'PRE_GAME_READY') state = 'LINEUP_LOCKED'
    else state = 'SCHEDULED'

    await prisma.game.update({ where: { id: g.id }, data: { lifecycleState: state } })
  }
}
```

**Risco:** zero (additive). `lifecycleVersion` permite optimistic locking em transições futuras.

### Migration 2 — `Athlete.verifiedFgb` (badge explícito)

```prisma
model Athlete {
  // ...existing fields...
  verifiedFgb        Boolean   @default(false)
  verifiedFgbAt      DateTime?
  verifiedFgbBy      String?
  // ...
  @@index([verifiedFgb])
}
```

**Convenção:** atleta `verifiedFgb = true` significa:
- `situation = 'ACTIVE'`
- `bidNumber IS NOT NULL`
- Documentos auditados pela secretaria (futuro: workflow de aprovação)

**Backfill:** todos os atletas que hoje têm `situation='ACTIVE' AND bidNumber IS NOT NULL` ganham `verifiedFgb=true` e `verifiedFgbAt = activatedAt`.

### Migration 3 — `GameEvent` correction chain

```prisma
model GameEvent {
  // ...existing fields...
  correctsEventId       String?   // este evento corrige aquele
  supersededByEventId   String?   // este evento foi invalidado por aquele
  correctsEvent         GameEvent?  @relation("GameEventCorrection", fields: [correctsEventId], references: [id], onDelete: SetNull)
  correctedByEvents     GameEvent[] @relation("GameEventCorrection")
  // ...
  @@index([correctsEventId])
  @@index([supersededByEventId])
}
```

**Regra:** quando se cria um evento de correção:
- Novo `GameEvent.correctsEventId = idDoEventoErrado`
- `GameEvent.supersededByEventId = idDaNovaCorrecao` (no antigo)

Projeção `GamePlayerStatLine` filtra `supersededByEventId IS NULL`.

**Risco:** zero (additive, self-relation opcional).

### Migration 4 — `GameOfficialReport` versionamento

```prisma
model GameOfficialReport {
  // ...existing fields...
  // remove @unique de gameId — vira muitas-versões-por-jogo
  // (atenção: precisa drop+add do unique index; tecnicamente é destrutivo no índice mas não nos dados)
  version           Int       @default(1)
  previousVersionId String?
  isCurrent         Boolean   @default(true)
  // ...
  @@unique([gameId, version])
  @@index([gameId, isCurrent])
}
```

**ATENÇÃO:** essa é a única migration **levemente destrutiva** — precisa dropar o índice `@unique([gameId])` e criar `@unique([gameId, version])`. **Dados existentes não são perdidos.** Backfill garante todos `version=1` e `isCurrent=true`.

**Alternativa não-destrutiva:** criar tabela nova `GameOfficialReportVersion` ligada à existente. Mais limpo arquiteturalmente mas adiciona JOIN em queries comuns. Recomendo a opção principal (modificar `GameOfficialReport`) com backfill controlado.

### Migration 5 — Enum FSDEF para `GameEvent.eventType`

Não muda o schema (continua String para flexibilidade), mas adiciona **constante em código**:

```typescript
// src/lib/constants/game-events.ts
export const FSDEF_EVENT_TYPES = {
  // Field goals
  TWO_PT_MADE: 'P2_MADE',
  TWO_PT_MISS: 'P2_MISS',
  THREE_PT_MADE: 'P3_MADE',
  THREE_PT_MISS: 'P3_MISS',
  // Free throws
  FREE_THROW_MADE: 'FT_MADE',
  FREE_THROW_MISS: 'FT_MISS',
  // Rebounds
  REBOUND_OFFENSIVE: 'REB_OFF',
  REBOUND_DEFENSIVE: 'REB_DEF',
  REBOUND_TEAM: 'REB_TEAM',
  // Plays
  ASSIST: 'AST',
  STEAL: 'STL',
  BLOCK: 'BLK',
  TURNOVER: 'TO',
  // Fouls
  FOUL_PERSONAL: 'F_PERS',
  FOUL_TECHNICAL: 'F_TEC',
  FOUL_UNSPORTSMANLIKE: 'F_UNS',
  FOUL_DISQUALIFYING: 'F_DSQ',
  // Game flow
  SUBSTITUTION_IN: 'SUB_IN',
  SUBSTITUTION_OUT: 'SUB_OUT',
  TIMEOUT: 'TIM',
  PERIOD_START: 'PER_START',
  PERIOD_END: 'PER_END',
  GAME_START: 'GAME_START',
  GAME_END: 'GAME_END',
  // Corrections (meta)
  CORRECTION: 'CORR',
} as const

export type FsdefEventType = typeof FSDEF_EVENT_TYPES[keyof typeof FSDEF_EVENT_TYPES]
```

Adiciona validação em service layer ao criar evento. Eventos legados ficam intactos (não migra valores históricos).

## E. Camada de service para state machine (Fase 1 — aplicação)

Novo arquivo: `src/lib/game-lifecycle.ts`

Exports principais:
- `canTransition(from, to): boolean` — matriz de transições válidas
- `transitionGame(gameId, to, ctx): Promise<Game>` — aplica transição com checks + audit log
- `assertMutable(gameId)` — throws se `lifecycleState IN (CONFIRMED, PUBLISHED)` (a menos que esteja em `UNDER_REVIEW`)
- `validateParity(gameId)` — antes de `CONFIRMED`, valida soma de stats = placar

Matriz de transições válidas:
```
DRAFT          → SCHEDULED, CANCELLED
SCHEDULED      → LINEUP_LOCKED, POSTPONED, CANCELLED
LINEUP_LOCKED  → LIVE, SCHEDULED (volta atrás se precisar), POSTPONED, CANCELLED
LIVE           → ENDED, CANCELLED
ENDED          → CONFIRMED (após paridade OK), UNDER_REVIEW
CONFIRMED      → PUBLISHED, UNDER_REVIEW
PUBLISHED      → UNDER_REVIEW
UNDER_REVIEW   → CONFIRMED (após correção aplicada e re-validada)
CANCELLED      → (terminal)
POSTPONED      → SCHEDULED (re-agendado)
```

Cada transição grava `GameAuditLog` com `actionType='LIFECYCLE_TRANSITION'`, `metaJson={from, to, reason}`.

## F. Ordem recomendada de execução

1. **Code-only first** (sem DB change): criar `src/lib/constants/game-events.ts` (FSDEF), `src/lib/game-lifecycle.ts` (state machine helpers, sem consumir `lifecycleState` ainda). **Reversível 100%.**
2. **Migration 1 + 2 + 3** num único `prisma migrate dev --name fase1_lifecycle_verified_corrections` — additive, baixíssimo risco.
3. **Backfill script** `scripts/backfill-fase1.ts` rodado em produção via Vercel CLI ou ssh — popula `lifecycleState`, `verifiedFgb`.
4. **Migration 4** separada `prisma migrate dev --name fase1_boxscore_versioning` — única que mexe em índice. Test local primeiro com DB de prod copiada.
5. **Habilitar guards em service layer** — só depois de tudo aplicado, fazer o admin existente passar pelo `transitionGame()`.

## G. Riscos identificados

| Risco | Mitigação |
|---|---|
| Backfill quebra prod | Rodar em janela de baixa atividade; backup do DB antes; idempotente (script pode re-rodar) |
| Migration 4 (boxscore unique index drop+add) corrompe dados | Backup obrigatório; testa em staging com dump de prod; rollback plan documentado |
| Código existente que consulta `status`/`liveStatus` continua funcionando? | Sim — não alteramos esses campos. `lifecycleState` é adicional. |
| Atleta com `verifiedFgb=true` aparece sem badge se UI ainda não foi atualizada? | UI consome o novo campo opcionalmente; default `false` em todos = nenhum atleta verificado até backfill rodar. |

## H. O que NÃO está nesta fase (fica pra próximas)

- DB-level constraints (Postgres trigger / RLS) — Fase 1.5
- UI para mostrar transições de lifecycle — Fase 2
- Painel admin "Jogos em UNDER_REVIEW" — Fase 7
- Migration do código existente para usar `lifecycleState` em vez de `status` — gradual, sem deadline

## I. Critérios de aceite

- [ ] Migration 1+2+3 aplicada em local sem erros
- [ ] Migration 4 aplicada em local sem perda de dados
- [ ] Backfill rodou e populou `lifecycleState` em 100% dos jogos existentes
- [ ] Backfill rodou e populou `verifiedFgb` em atletas elegíveis
- [ ] Lib `game-lifecycle.ts` com testes unitários cobrindo a matriz
- [ ] `assertMutable()` lança erro ao tentar update em jogo `PUBLISHED`
- [ ] `validateParity()` retorna erros claros quando soma stats ≠ placar
- [ ] FSDEF constants documentadas em `STYLE_GUIDE.md` ou `docs/game-events.md`
- [ ] Smoke test: criar jogo de teste, simular fluxo DRAFT → ... → PUBLISHED, verificar audit log

---

## Perguntas antes de aplicar

1. **Pode rodar migration localmente** e testar com seu dev.db (SQLite)? Ou prefere que eu prepare o SQL como dry-run primeiro?
2. **Backfill em produção** — quem roda? Posso preparar o script + comando, mas execução em prod precisa de você (ou alguém com acesso ao Turso).
3. **Migration 4 (boxscore unique)** — você prefere a versão "destrutiva-leve" (drop+add index, simples) ou a alternativa não-destrutiva (tabela nova `GameOfficialReportVersion`)? Recomendo a 1ª por simplicidade, com backup.
4. **FSDEF event types** — algum nome customizado preferido? Os atuais seguem padrão internacional (P2_MADE, P3_MISS, REB_OFF). Se quiser PT/BR pode ser (PONTO_2_FEITO, etc.).
