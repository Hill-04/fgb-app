# Fase 1 — Roteiro de Deployment em Produção

> Aplica as mudanças de schema da Fase 1 (lifecycleState, verifiedFgb, correctionChain, GameOfficialReportVersion) ao banco Turso de produção.
>
> **Risco:** baixo (todas mudanças aditivas, idempotentes). Mas faça backup antes — dado histórico de atletas e jogos é insubstituível.

## Pré-requisitos

- [ ] Backup atualizado do Turso de produção (snapshot ou dump SQL)
- [ ] `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` disponíveis no shell
- [ ] Branch atual deployada na Vercel inclui `src/lib/db-patch.ts` com os patches da Fase 1 e `src/lib/game-lifecycle.ts`
- [ ] Equipe avisada (janela de baixa atividade preferível)

## Opção A — Deploy automático via `db-patch.ts` (recomendado)

O `ensureDatabaseSchema()` em `src/lib/db-patch.ts` aplica os patches automaticamente na **primeira request** depois do deploy. Como já adicionei os 5 patches da Fase 1 lá, basta:

1. **Commit + push** o código (já feito — vai junto com Fase 1)
2. **Deploy na Vercel** (automático via webhook)
3. **Trigger** qualquer request que passe pelo `ensureDatabaseSchema` (ex: acessar `/admin/dashboard`)
4. **Verificar logs Vercel** — buscar `[DB_PATCH]` para confirmar que os patches da Fase 1 rodaram com status SUCCESS ou SKIPPED_EXISTS

**Verificação:**
```sql
-- No console Turso (ou outra ferramenta SQL conectada):
PRAGMA table_info(Game);     -- deve listar lifecycleState e lifecycleVersion
PRAGMA table_info(Athlete);  -- deve listar verifiedFgb, verifiedFgbAt, verifiedFgbBy
PRAGMA table_info(GameEvent); -- deve listar correctsEventId, supersededByEventId
PRAGMA table_info(GameOfficialReport); -- deve listar currentVersion
SELECT name FROM sqlite_master WHERE type='table' AND name='GameOfficialReportVersion';
```

## Opção B — SQL manual via Turso CLI (fallback)

Se preferir aplicar fora do path do `db-patch.ts` (ex: aplicar antes do deploy do código):

```bash
# Conecta no shell SQL do Turso
turso db shell <nome-do-db-prod>

# Cola o conteúdo de:
# prisma/migrations/20260511_fase1_lifecycle_verified_corrections.sql
```

**Atenção:** se um dos `ALTER TABLE ADD COLUMN` falhar com "duplicate column" (alguém já aplicou), é seguro ignorar — o script é idempotente apenas via `db-patch.ts` (que checa `PRAGMA table_info` antes). SQL puro vai falhar na repetição. Aplique uma única vez.

## Backfill — popula campos novos

Depois da migration aplicada (Opção A ou B), rodar o backfill **uma vez**:

```bash
# Local (dev.db) — smoke test, opcional
DATABASE_URL=file:./dev.db npx tsx scripts/backfill-fase1.ts

# Produção
DATABASE_URL=$TURSO_DATABASE_URL DATABASE_AUTH_TOKEN=$TURSO_AUTH_TOKEN \
  npx tsx scripts/backfill-fase1.ts
```

**O que faz:**
- Para cada `Game`: deriva `lifecycleState` a partir de `status`/`liveStatus`/`isLivePublished` (usa `deriveLifecycleFromLegacy`). Não rebaixa estados já avançados.
- Para cada `Athlete` com `situation='ACTIVE' AND bidNumber IS NOT NULL`: marca `verifiedFgb=true`, `verifiedFgbAt = activatedAt` (ou agora se vazio), `verifiedFgbBy='SYSTEM_BACKFILL_FASE1'`.

**Idempotência:** pode rodar várias vezes. Não desfaz alterações manuais subsequentes.

## Verificações pós-backfill

```sql
-- Distribuição de lifecycleState:
SELECT lifecycleState, COUNT(*) FROM Game GROUP BY lifecycleState;

-- Total verificados:
SELECT COUNT(*) FROM Athlete WHERE verifiedFgb = 1;

-- Atletas ACTIVE com bidNumber que NÃO foram verificados (deveria ser 0 após backfill):
SELECT COUNT(*) FROM Athlete
WHERE situation = 'ACTIVE' AND bidNumber IS NOT NULL AND verifiedFgb = 0;
```

## Rollback (se algo der errado)

**Os ALTER TABLE ADD COLUMN não são reversíveis facilmente em SQLite** — não há `DROP COLUMN` nativo (precisa recriar tabela). Por isso a estratégia é:

1. As colunas novas têm defaults seguros (`0`, `'SCHEDULED'`, `NULL`) — não quebram código antigo
2. Se uma migration de coluna falhou em produção, o `db-patch.ts` reporta como ERROR mas a app continua subindo (patches não-críticos)
3. Para "desfazer logicamente": basta resetar `lifecycleState = 'SCHEDULED'` e `verifiedFgb = 0` em todas as linhas via UPDATE

**Para uma reversão completa de schema**: restore do backup pré-migration.

## Próximas fases (não fazem parte desta deploy)

- **Fase 2**: Wizard com preview live + IA assistida — só código, sem DB change
- **Fase 3**: UI consumir `verifiedFgb` (badges em `AthleteCard`, `CarteirinhaCard`, súmula)
- **Fase 4**: Live scout usando FSDEF event types
- **Fase 5**: Endpoint `closeGame(id)` com `validateParity` + geração de `GameOfficialReportVersion v1`

## Critérios de aceite

- [ ] Patches da Fase 1 visíveis em `db-patch.ts`
- [ ] Após deploy, `[DB_PATCH]` nos logs da Vercel mostra status `SUCCESS` ou `SKIPPED_EXISTS` para todos
- [ ] `PRAGMA table_info` confirma colunas novas em `Game`, `Athlete`, `GameEvent`, `GameOfficialReport`
- [ ] Tabela `GameOfficialReportVersion` existe
- [ ] Backfill rodou: distribuição razoável de `lifecycleState` no SELECT acima
- [ ] Atletas ACTIVE+BID agora têm `verifiedFgb=1`
- [ ] Nenhum erro em logs durante 24h após deploy
- [ ] Smoke test de listagem `/atletas` e `/jogos` continua funcionando
