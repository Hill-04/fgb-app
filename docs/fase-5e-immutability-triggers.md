# Fase 5.E — Hard immutability via SQLite triggers

**Status:** entregue 2026-05-11
**Aplicacao:** automatica via `ensureDatabaseSchema()` (db-patch.ts)
**Escopo:** apenas tabela `Game`. Registration fica para Fase 6.H futura.

## Objetivo

Defesa em profundidade. A state machine app-level (`game-lifecycle.ts`,
`game-close-service.ts`) ja garante que jogos `CONFIRMED`/`PUBLISHED` nao
podem ter dados alterados sem passar por `UNDER_REVIEW`. Os triggers
adicionam uma segunda camada que protege contra:

- UPDATE ad-hoc via console SQL ou Turso CLI
- Scripts de manutencao que esquecam de respeitar o lifecycle
- Bugs futuros em codigo novo que mude `Game` direto via Prisma sem
  passar pelos services

A nota original do roadmap mencionava "Postgres trigger" mas o app usa
SQLite/libSQL/Turso — o conceito e equivalente, soh muda o dialeto.

## Triggers criados

### 1. `Game_immutable_data_update`

**Quando:** `BEFORE UPDATE ON Game`
**Bloqueia:** mutacao de qualquer campo de dado quando
`OLD.lifecycleState IN ('CONFIRMED','PUBLISHED')` E
`NEW.lifecycleState = OLD.lifecycleState`.

Campos protegidos: `homeScore`, `awayScore`, `homeTeamId`, `awayTeamId`,
`dateTime`, `phase`, `round`, `categoryId`, `championshipId`, `status`.

Campos NAO protegidos (mutaveis livremente): `attendance`,
`wasRescheduled`, `rescheduleReason`, `lifecycleVersion`, `clockDisplay`,
`isLivePublished`, etc — sao metadata que podem ser corrigidos sem
afetar o resultado oficial.

### 2. `Game_immutable_delete`

**Quando:** `BEFORE DELETE ON Game`
**Bloqueia:** qualquer DELETE quando
`OLD.lifecycleState IN ('CONFIRMED','PUBLISHED')`.

## Por que nao bloqueia transicoes legitimas

As tres transicoes que tocam jogo CONFIRMED/PUBLISHED:

| Service | OLD.state | NEW.state | Resultado |
|---|---|---|---|
| `requestReview()` | CONFIRMED ou PUBLISHED | UNDER_REVIEW | NEW != OLD -> trigger nao dispara |
| `publishGame()` | CONFIRMED | PUBLISHED | NEW != OLD -> trigger nao dispara |
| `closeGame()` (re-confirmacao) | UNDER_REVIEW | CONFIRMED | OLD nao esta em (CONFIRMED, PUBLISHED) -> trigger nao dispara |

Qualquer outro UPDATE com OLD CONFIRMED/PUBLISHED que tente mudar dados
sem mudar o lifecycleState e bloqueado com:

```
Game CONFIRMED/PUBLISHED imutavel: solicite UNDER_REVIEW antes de modificar dados
```

## Como remover (emergencia)

Se algum bug do trigger bloquear operacao legitima em prod, droppar via
Turso CLI ou tsx script:

```sql
DROP TRIGGER IF EXISTS Game_immutable_data_update;
DROP TRIGGER IF EXISTS Game_immutable_delete;
```

Os triggers sao idempotentes (`CREATE TRIGGER IF NOT EXISTS`) — re-rodar
`ensureDatabaseSchema()` recria.

## Validacao apos deploy

1. Aguardar primeira request em prod (aplica triggers via `ensureDatabaseSchema()`)
2. Testar em /admin/championships/[id]/jogos/[gameId]/sumula:
   - Fechar um jogo (LIVE -> CONFIRMED) -> deve funcionar
   - Solicitar revisao (CONFIRMED -> UNDER_REVIEW) -> deve funcionar
   - Re-confirmar (UNDER_REVIEW -> CONFIRMED) -> deve funcionar
3. Smoke test SQL (opcional, em REPL Turso):
   ```sql
   -- Pega um jogo CONFIRMED qualquer
   SELECT id, lifecycleState, homeScore FROM Game WHERE lifecycleState='CONFIRMED' LIMIT 1;
   -- Tenta mutar score sem sair do estado -> deve falhar
   UPDATE Game SET homeScore = homeScore + 1 WHERE id = '<id>';
   -- Esperado: SQLITE_CONSTRAINT_TRIGGER: Game CONFIRMED/PUBLISHED imutavel...
   ```
