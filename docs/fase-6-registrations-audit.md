# Fase 6 — Auditoria de Inscrições

> Mapeamento do fluxo atual de inscrições (Registration) + gaps + recomendações.

## Modelos no schema

### `Registration` (linha 198 do schema)
- `status: String @default("PENDING")` — legacy, valores observados: `PENDING`, `CONFIRMED`, `REJECTED`
- Sem campos `confirmedAt`, `confirmedByUserId`, `rejectionReason` estruturados
- `observations String?` é o único campo livre, não estruturado para razão de rejeição
- `registeredAt DateTime @default(now())` + `updatedAt` (mas sem actor histórico)
- Relacionamentos: team, championship, categories, fees, blockedDates, financialInvoices

### `AthleteRegistrationRequest` (linha 844 do schema)
Modelo separado, mais maduro:
- `status: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED'` (provável)
- `cbbCheckStatus` integração CBB
- `submittedAt`, `reviewedAt`, `reviewedByUserId`, `approvedAt`, `approvedByUserId`, `rejectionReason`
- **Já tem audit fields** que faltam em `Registration`

## UI atual

### Team side — `/team/registrations/page.tsx` (220 linhas)
- Mostra 3 status: `CONFIRMED` (verde), `PENDING` (amarelo), `REJECTED` (vermelho)
- Status display robusto, integrado com fees summary (pago/pendente/total)
- Filtra registrations por team
- Empty state, CTA "Nova Inscrição"
- **Bom UX**, sem grandes problemas

### Admin side — `/admin/championships/[id]/registrations/page.tsx` (729 linhas)
- Tabela de registrations da categoria
- Modal de edição com select de status: **apenas `PENDING` ou `CONFIRMED`** (linha 516)
- **`REJECTED` não existe no admin** — não dá pra recusar via UI!
- Acoes: Editar, Taxas, Fatura, Delete
- Status display: `CONFIRMED` (verde) ou `PENDING` (orange) — sem REJECTED

### Admin side — `/admin/registrations/page.tsx` (5 linhas)
- Provável redirect/placeholder

## Gaps identificados

### Gap 1 — Status REJECTED é "fantasma"
- **Team vê** e filtra REJECTED (linha 77 do page.tsx)
- **Admin NÃO pode setar** REJECTED via UI (modal só oferece PENDING/CONFIRMED)
- **Resultado**: pra rejeitar inscrição admin precisa entrar no DB direto ou usar workaround
- **Fix**: adicionar botão "Recusar" no modal de edição admin + campo de motivo

### Gap 2 — Sem audit fields em Registration
- Não sabemos QUEM confirmou, QUANDO especificamente (`updatedAt` é genérico), POR QUE foi recusada
- **Comparação**: `AthleteRegistrationRequest` já tem esses campos. `Registration` não.
- **Fix**: adicionar `confirmedAt`, `confirmedByUserId`, `rejectedAt`, `rejectedByUserId`, `rejectionReason`

### Gap 3 — Sem state machine validada
- Admin pode pular CONFIRMED → PENDING → CONFIRMED sem restrição
- Não há reason obrigatório pra mudar status
- **Comparação**: Game tem `lifecycleState` + `canTransition()` (Fase 1)
- **Fix**: adicionar `Registration.lifecycleState` + service de transição

### Gap 4 — Sem histórico de mudanças visível para team
- Team vê o status atual, mas não sabe quando virou CONFIRMED, quem aprovou, ou se a inscrição já passou por revisão
- **Fix**: tabela `RegistrationAuditLog` (similar `GameAuditLog`) + timeline na UI team

### Gap 5 — Sem state intermediário "UNDER_REVIEW"
- Hoje é só PENDING → CONFIRMED. Admin não sinaliza "estou revisando" pra team.
- Team fica sem saber se a inscrição está parada na fila ou em análise ativa
- **Fix**: estados intermediários (SUBMITTED, UNDER_REVIEW) + UI mostra timeline

### Gap 6 — Sem validação de janela de inscrição
- `Championship.registrationOpenedAt` e `regDeadline` existem mas não vi enforcement consistente
- Admin pode confirmar inscrição submetida fora do prazo sem aviso
- **Fix**: warnings na UI + bloqueio condicional no service

### Gap 7 — `/admin/registrations/page.tsx` é placeholder
- 5 linhas. Provavelmente redirect.
- Deveria ser **dashboard agregado** mostrando: inscrições pendentes em todos os campeonatos, fila de review, alertas
- **Fix**: rebuild como dashboard real

### Gap 8 — Sem notificações ao team
- Quando admin confirma/recusa, team não é notificado (email/in-app)
- **Fix**: integrar com `Notification` model (já existe no schema linha 1017)

## Fase 6 entregue (v1)

**Service pure functions (sem DB change):** `src/lib/registration-lifecycle.ts`
- 6 estados: DRAFT, SUBMITTED, UNDER_REVIEW, CONFIRMED, REJECTED, CANCELLED
- Matriz de transições válidas
- `canTransition`, `assertCanTransition`, `validTransitions`
- `isImmutable`, `isTerminal`
- `deriveLifecycleFromLegacy({status})` — mapping de PENDING/CONFIRMED/REJECTED para lifecycle
- Display helpers: `getStateLabel`, `getStateDescription` (rótulos pt-BR para UI)

## Roadmap proposto

### Fase 6.B — Schema migration (precisa aprovação)
**Aditivo:** adicionar em `Registration`:
- `lifecycleState String @default("SUBMITTED")` (defaults para inscrições existentes via backfill)
- `lifecycleVersion Int @default(0)` (optimistic locking pattern)
- `confirmedAt DateTime?`, `confirmedByUserId String?`
- `rejectedAt DateTime?`, `rejectedByUserId String?`
- `rejectionReason String?`
- `submittedAt DateTime?`

**Backfill:** para registrations existentes, derivar `lifecycleState` de `status` legacy via `deriveLifecycleFromLegacy`.

**Risco:** baixo (aditivo). ~30min.

### Fase 6.C — Service transacional `confirmRegistration` / `rejectRegistration`
Similar ao closeGame (Fase 5):
- `confirmRegistration({registrationId, actorUserId})` — valida transição + UPDATE atomico + audit log
- `rejectRegistration({registrationId, actorUserId, reason})` — exige reason min 3 chars
- `requestRevisionRegistration(...)` — CONFIRMED → UNDER_REVIEW
- `cancelRegistration(...)`

**Risco:** baixo. ~1h.

### Fase 6.D — UI Admin: botão Recusar + modal de motivo
- No modal de edição admin (atual), adicionar botão vermelho "Recusar"
- Modal exige `rejectionReason` antes de confirmar
- Mostrar quem confirmou/recusou e quando

**Risco:** médio (toca a página de 729 linhas). ~1h.

### Fase 6.E — UI Team: timeline visual
- Cada registration mostra micro-timeline: "Submetida em X · Em análise desde Y · Confirmada em Z"
- Quando REJECTED, mostra motivo
- Botão "Re-submeter" se REJECTED

**Risco:** baixo. ~45min.

### Fase 6.F — `/admin/registrations/page.tsx` dashboard
- Substituir placeholder de 5 linhas
- KPIs: inscrições pendentes hoje, em revisão, recusadas, etc.
- Lista cross-championship de itens prioritários

**Risco:** baixo. ~1.5h.

### Fase 6.G — Notificações
- Integrar com `Notification` model existente
- Eventos: status mudou, taxa vencendo, prazo se aproximando

**Risco:** médio. ~2h.

## Critérios de aceite para "fluxo de inscrição funciona"

- [ ] Team consegue criar inscrição em rascunho, completar, submeter
- [ ] Admin vê fila de inscrições para analisar (filtros: pending, in review)
- [ ] Admin pode aprovar OU recusar (com motivo) — ambos via UI
- [ ] Team vê timeline completa do que aconteceu na inscrição
- [ ] Audit log preservado: quem fez o quê e quando
- [ ] Notificações automáticas em mudanças de estado
- [ ] Validações de janela de inscrição enforced

## O que NÃO foi feito intencionalmente nesta fase

- DB migration (precisa de aprovação como na Fase 1)
- UI changes (alto risco em 729 linhas — Fase 6.D)
- Notificações (depende de integração com Notification model — Fase 6.G)
- `AthleteRegistrationRequest` está fora deste escopo (modelo separado, fluxo paralelo, próprio audit já existe)
