# Fase 5 — Game Close Service

> Service transacional que fecha um jogo com validação de paridade, audit log e versionamento de súmula.

## Por que existe

Antes da Fase 5 o app tinha `finalizeGame(gameId)` em `sumula/actions.ts` que só fazia:
1. `UPDATE Game SET status = 'FINISHED'`
2. Recalcular Standings da categoria

Problemas:
- ✗ Nenhuma validação de paridade (jogador 1: 80 pontos, mas placar oficial só 50 — passa direto)
- ✗ Re-fechamento permitido (sem lock pós-CONFIRMED)
- ✗ Sem audit log no fechamento
- ✗ Sem versionamento da súmula (correção pós-jogo perde histórico)
- ✗ Sem cadeia de revisão oficial

A Fase 5 entrega um service novo (`src/lib/game-close-service.ts`) com server actions wrapper que **coexistem** com o legacy — não substituem, não quebram.

## API pública

### `closeGame(input)`

Fecha um jogo: `LIVE` / `ENDED` / `UNDER_REVIEW` / `SCHEDULED` / `LINEUP_LOCKED` → **`CONFIRMED`**.

```ts
import { closeGame } from '@/lib/game-close-service'

const result = await closeGame({
  gameId: 'abc-123',
  actorUserId: 'user-456',           // opcional, vai pro audit log
  allowParityErrors: false,           // padrão false; true só pra forçar com erro
  reason: 'Re-confirmação pós-revisão' // obrigatório se vier de UNDER_REVIEW
})

if (!result.ok) {
  console.error(result.parityErrors)
  return
}

console.log(`Jogo fechado v${result.versionCreated}`)
```

**O que faz transacionalmente:**
1. Lê estado atual do `Game`
2. Bloqueia se `lifecycleState IN (CONFIRMED, PUBLISHED)` — exige `requestReview()` primeiro
3. Lê `GamePlayerStatLine` e calcula paridade (Σ pontos jogador vs placar oficial)
4. Se paridade falhar e `allowParityErrors=false` → retorna `ok: false` sem efeito colateral
5. **Em transação:**
   - `UPDATE Game SET lifecycleState='CONFIRMED', lifecycleVersion=+1, status='FINISHED'`
   - `UPSERT GameOfficialReport` (incrementa `currentVersion`)
   - `INSERT GameOfficialReportVersion` (snapshot imutável da versão atual)
   - `INSERT GameAuditLog` (registra a transição + paridade + razão)
6. **Fora da transação** (idempotente): `recalculateStandings(categoryId)`

**Idempotência:** chamar 2x retorna `ok: false` no 2º (já confirmado). Para re-fechar, precisa `requestReview` → corrigir → `closeGame` de novo (cria v2).

### `requestReview(input)`

Solicita revisão oficial: `CONFIRMED` / `PUBLISHED` → **`UNDER_REVIEW`**.

```ts
import { requestReview } from '@/lib/game-close-service'

await requestReview({
  gameId: 'abc-123',
  reason: 'Árbitro corrigiu stat de pontuação do #23',
  actorUserId: 'user-456'
})
```

Após isso, o jogo aceita correções via `GameEvent.correctsEventId` (Fase 1) e quando reformatado pode ser re-fechado.

### `publishGame(input)`

Publica jogo confirmado: `CONFIRMED` → **`PUBLISHED`**. Marca `isLivePublished=true`. Torna o jogo visível publicamente e logicamente imutável.

```ts
await publishGame({ gameId, actorUserId })
```

### `readGameLifecycle(gameId)`

Lê estado atual + histórico de versões + audit log recente. Útil pra UI de "Status do Jogo":

```ts
const lifecycle = await readGameLifecycle(gameId)
// lifecycle.game.lifecycleState — estado atual
// lifecycle.report.currentVersion — versão atual da súmula
// lifecycle.versions — array de GameOfficialReportVersion (mais recente primeiro)
// lifecycle.recentAudit — últimos 20 GameAuditLog
```

## Server Actions (com auth admin)

Em `src/app/admin/championships/[id]/jogos/[gameId]/sumula/close-actions.ts`:

- `closeGameAction({ gameId, championshipId, allowParityErrors?, reason? })`
- `requestReviewAction({ gameId, championshipId, reason })`
- `publishGameAction({ gameId, championshipId })`

Cada um:
- Exige `requireAdminSession()` — retorna `{ ok: false, error: 'Acesso negado' }` se não autenticado
- Captura erros e retorna `{ ok, error?, data? }` discriminado
- Revalida rotas afetadas (`/admin/...`, `/jogos/...`)

Usar de Client Component:
```tsx
'use client'
import { closeGameAction } from '../close-actions'

async function onClose() {
  const res = await closeGameAction({ gameId, championshipId })
  if (!res.ok) {
    alert(res.error)
    return
  }
  toast.success(`Fechado v${res.data.versionCreated}`)
}
```

## Validação de Paridade — o que checa hoje

Fase 5 v1 valida **apenas** o básico:
- `Σ GamePlayerStatLine.points (home)` deve igualar `Game.homeScore`
- `Σ GamePlayerStatLine.points (away)` deve igualar `Game.awayScore`

Validações mais profundas que **não estão implementadas** (próximas iterações):
- `twoPtMade <= twoPtAttempted` (e idem 3pt, ft)
- `reboundsOffensive + reboundsDefensive == reboundsTotal`
- `points == twoPtMade*2 + threePtMade*3 + freeThrowsMade` (consistência interna)
- Σ pontos por quarto (`GamePeriodScore`) == placar final
- Substituições pareadas (todo IN tem OUT no mesmo período)
- Limite de 5 faltas pessoais por jogador antes de disqualified

Quando adicionar: estender `validateParityNumbers` em `src/lib/game-lifecycle.ts` ou criar `validateGameDeepParity` separadamente.

## Audit Log — o que fica registrado

Toda transição grava `GameAuditLog` com `actionType`:
- `GAME_CLOSED` — fechamento (`closeGame`)
- `REVIEW_REQUESTED` — solicitação de revisão
- `GAME_PUBLISHED` — publicação

Cada entrada inclui:
- `actorUserId` (quem disparou)
- `metaJson` (estados from/to, versão, razão, paridade detalhada)
- `createdAt` (quando)

Consultar histórico:
```ts
const audit = await prisma.gameAuditLog.findMany({
  where: { gameId },
  orderBy: { createdAt: 'desc' }
})
```

## Imutabilidade — garantias

| Operação | Permitido em |
|---|---|
| Editar stats/scores diretamente no DB | Apenas até `CONFIRMED` (state machine bloqueia) |
| `closeGame` 2x | Bloqueado — exige `requestReview` no meio |
| `requestReview` de jogo `SCHEDULED` | Bloqueado pela matriz de transições |
| Acessar versão antiga de súmula | Sempre — `GameOfficialReportVersion` é append-only |

**Limitação atual:** a garantia de imutabilidade é em **camada de aplicação** (services). O DB ainda aceita UPDATE direto. Para imutabilidade hard, próximas fases podem adicionar trigger Postgres (libSQL/Turso suporta) que bloqueia UPDATE em `Game` quando `lifecycleState IN (CONFIRMED, PUBLISHED)`.

## Pendências — Fases 5.B e 5.C

### Fase 5.B — UI de fechamento
- Botão "Fechar Jogo" na rota `/admin/championships/[id]/jogos/[gameId]/sumula` que chama `closeGameAction`
- Modal mostrando erros de paridade detalhados quando falha
- Botão "Forçar Fechamento (admin)" com confirmação dupla para casos excepcionais
- Painel "Histórico de Versões" mostrando todas as `GameOfficialReportVersion`
- Botão "Solicitar Revisão" + modal com motivo

### Fase 5.C — PDF da Súmula
- Gerador de PDF server-side via `@react-pdf/renderer` (precisa adicionar dep) ou `jsPDF` (já tem)
- Template visual com brasão FGB, tricolor stripe, box score, assinatura de árbitros
- QR Code com hash de verificação
- Salvar em `Vercel Blob` (já tem `@vercel/blob` dep) e setar `officialPdfUrl` na version

## Smoke test manual

```bash
# Local com dev.db (não tem dados, então vai testar o caminho de erro)
DATABASE_URL=file:./dev.db npx tsx -e "
import { closeGame } from './src/lib/game-close-service'
;(async () => {
  try {
    const r = await closeGame({ gameId: 'NAO-EXISTE' })
    console.log(r)
  } catch (e) { console.error('Erro esperado:', e.message) }
})()
"
```

Deve imprimir: `Erro esperado: Jogo NAO-EXISTE nao encontrado`
