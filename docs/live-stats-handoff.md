# FGB App - Live Stats Handoff

Branch atual de trabalho: `codex/championships-phase-a-navigation`

Repositorio: `https://github.com/Hill-04/fgb-app`

Banco: Turso/libSQL, com colunas do Live Stats ja aplicadas segundo o handoff anterior.

Deploy: Vercel.

## Objetivo do modulo

Conectar o FGB App ao fluxo de jogo ao vivo em dois modos:

- Modo A: sincronizacao com FIBA LiveStats v8 local.
- Modo B: scout nativo do FGB, usando a mesa/admin ja existente.

O Match Centre publico deve consumir snapshots ao vivo, exibir placar, box score, lideres, lance a lance, mapa de arremessos, estatisticas e previa.

## Implementado

### Schema Prisma e banco

Campos adicionados ao `Game`:

- `fibaFixtureId`
- `lastFibaSyncAt`

Campos adicionados ao `GamePlayerStatLine`:

- `pointsInPaint`
- `fastBreakPoints`
- `secondChancePoints`
- `pointsFromTurnover`
- `dunks`
- `blocksReceived`
- `foulsTechnical`
- `fibaIndex`

Campo ja existente e mapeado no snapshot:

- `plusMinus`

### Cliente FIBA

Arquivo: `src/lib/fiba/client.ts`

Funcoes esperadas:

- `fibaIsOnline()`
- `fibaGetGames()`
- `fibaGetGameState(fixtureId)`
- `fibaGetBoxScore(fixtureId)`
- `fibaGetActions(fixtureId, from?)`
- `fibaGetSetup(fixtureId)`

Variaveis:

- `FIBA_LIVESTATS_ENABLED`
- `FIBA_LIVESTATS_PORT`

### Mapper FIBA para FGB

Arquivo: `src/lib/fiba/mapper.ts`

Funcoes esperadas:

- `ACTION_LABELS_PT`
- `buildActionDescription(action)`
- `mapFibaBoxScoreToStatLine(player)`
- `mapFibaActionType(action)`
- `clockToMs(clock)`

### Endpoint de sync FIBA

Arquivo: `src/app/api/live/sync/[gameId]/route.ts`

Responsabilidades:

- exigir usuario admin autenticado;
- receber `fixtureId`;
- atualizar `Game` com placar, periodo e metadados FIBA;
- fazer upsert de `GamePlayerStatLine`;
- criar novos `GameEvent` sem duplicar eventos ja sincronizados;
- retornar resumo do estado sincronizado.

### Controles admin de sincronizacao

Arquivo: `src/modules/live-game/components/admin-live-table-page.tsx`

Implementado:

- campo para informar `fixtureId`;
- botao `Sincronizar agora`;
- opcao de sincronizacao automatica a cada 5s;
- auto sync somente com jogo em `LIVE`;
- guard contra sync concorrente;
- feedback de sucesso/erro;
- refresh do snapshot apos sync.

Hook atualizado:

- `src/hooks/useLiveGame.ts`
- expoe `fibaFixtureId`, `lastFibaSyncAt` e `refresh`.

### SSE publico

Arquivo: `src/app/api/live/[gameId]/stream/route.ts`

Responsabilidades:

- enviar snapshot completo a cada 3s;
- permitir reconexao do cliente;
- usar `LiveGameService.getSnapshot()` e `buildPublicLiveSnapshot()`.

### Match Centre publico

Arquivo: `src/app/live/[id]/page.tsx`

Abas esperadas:

- Resumo
- Box Score
- Lideres
- Lance a Lance
- Mapa de Arremessos
- Estatisticas
- Previa

### Shot Chart

Arquivo: `src/components/ShotChart.tsx`

Responsabilidades:

- renderizar meia quadra FIBA em SVG;
- marcar arremessos convertidos/errados;
- diferenciar mandante e visitante por cor.

### Snapshot publico extendido

Arquivo: `src/modules/live-game/services/live-public-snapshot.ts`

Campos esperados:

- `periodScores`
- `playByPlay`
- `shots`
- `game.currentPeriod`
- `game.clockDisplay`
- `game.homeTimeoutsUsed`
- `game.championship`
- `game.category`
- `boxScore.players[].plusMinus`
- `boxScore.players[].isStarter`
- `boxScore.players[].reboundsOffensive`
- `boxScore.players[].reboundsDefensive`

### Integracoes no site

Arquivos:

- `src/app/page.tsx`
- `src/components/PublicHeader.tsx`
- `src/app/api/public/live-count/route.ts`

Implementado:

- barra de jogos ao vivo na home usando Prisma;
- links para `/live/[id]`;
- badge de jogos ao vivo no header;
- endpoint publico de contagem.

## Validacoes ja feitas

Build:

- `npm run build`: passou apos a conexao dos controles admin de sync.

Smoke leve:

- `/live/3c4d8638-eb83-4369-9164-3a2527f7d80a`: 200.
- `POST /api/live/sync/[gameId]` sem sessao admin: 401.

Limitacao:

- sincronizacao real contra FIBA LiveStats local ainda precisa ser testada com o aplicativo FIBA rodando na porta configurada.

## Pendencias organizadas

### Prioridade alta

1. Configurar envs na Vercel:
   - `FIBA_LIVESTATS_ENABLED=false` em producao;
   - `FIBA_LIVESTATS_PORT=8084`.

2. Testar sync real com FIBA LiveStats local:
   - abrir app FIBA;
   - obter `fixtureId`;
   - acionar sync manual no admin;
   - validar placar, box score e eventos.

### Prioridade media

3. Criar captura de coordenadas para arremessos no scorekeeper nativo:
   - componente sugerido: `src/components/ShotChartPicker.tsx`;
   - salvar `x` e `y` no payload do evento;
   - nao alterar engine sem necessidade.

4. Auditar descricoes do play-by-play no modo nativo:
   - confirmar se eventos nativos geram descricao suficiente;
   - evitar duplicar logica se `LiveGameService` ja cobre.

### Prioridade baixa

5. Expor melhor jogos ao vivo em `/jogos`:
   - secao `Ao Vivo Agora`;
   - links diretos para `/live/[id]`.

6. Expor CTA em `/jogos/[id]`:
   - botao `Ver ao vivo` quando o jogo estiver publicado e em estado live-like.

7. Expor campos FIBA no admin:
   - `pointsInPaint`;
   - `fastBreakPoints`;
   - `secondChancePoints`;
   - `dunks`;
   - `fibaIndex`.

## Regras de continuidade

- Nao criar engine nova.
- Nao mexer em financeiro, BID/atletas, portal ou campeonatos quando a sprint for Live Stats.
- Nao alterar `LiveGameService` sem justificativa concreta.
- Nao criar migration sem plano aprovado.
- Nao commitar `.env`, `.next`, logs, screenshots ou `prisma/dev.db`.
- Sempre rodar build e smoke da rota alterada antes de commit/push.

## Proxima acao recomendada

Como as envs da Vercel dependem de acesso externo e a CLI nao ficou disponivel nesta sessao, a proxima acao segura no codigo e fechar as pendencias publicas pequenas:

- `/jogos` deve destacar partidas ao vivo publicadas.
- `/jogos/[id]` deve mostrar CTA para o Match Centre quando aplicavel.

