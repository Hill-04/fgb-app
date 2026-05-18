# FGB App — Master Task List

**Última atualização:** 18/05/2026
**Branch ativa:** `feature/pm-06-real-data`
**Top commit:** `594d5c8` (PM-06.8 disable run buttons)

**Como usar este arquivo:**
- Marque `[x]` quando concluir uma tarefa
- Adicione novas tarefas na seção "Backlog novo"
- Atualize o "Status atual do projeto" quando merge para `main`
- Este arquivo é a fonte da verdade — qualquer coisa não listada aqui está fora do escopo atual

---

## 🎯 ESTADO ATUAL (validado)

### Banco produção (Turso)
- 1 user (Brayan, isFederationSuperAdmin: false)
- 18 teams com institutionalEmail populado
- 676 athletes com registrationNumber
- 48 coachStaff
- 4 articles
- 15 categories globais (Sub 8 → Sub 21 + Adulto)
- Outras entidades: 0

### Branches ativas
- `main` — produção
- `feature/pm-06-real-data` — PM-06.3 fechado + PM-06.4 em preview
- `feature/login-animated-basketball` — parqueado (3 commits, sem PR)
- `feature/pm-06n2-athlete-form-overhaul` — base do stash@{0}

### User de teste
- Email: `teste@bgcompany.dev`
- Senha: `teste123`
- Team: Grêmio Náutico União (ADMIN, ACTIVE)

---

## 📋 BLOCO 1 — PMs em andamento (PRIORIDADE MÁXIMA)

### PM-06 — Dados reais da federação
- [x] PM-06.0 — Schema Category global + endpoint seed-categories
- [x] PM-06.1 — Endpoint purge-fake-data (executado)
- [x] PM-06.2 — Seed 15 categorias globais
- [x] PM-06.3 — Schema Team.institutionalEmail + validate-team-cnpj + seed (18/18)
- [x] PM-06.4 — Endpoint audit-athletes + tela admin (deployed em preview)
- [ ] **PM-06.4 — Merge para main** (5 min)
- [x] **PM-06.5 — Audit coachStaff** (48 vs 50 do CSV)
- [x] **PM-06.6 — Criar 18 users dos clubes**
- [x] **PM-06.7 — Brayan vira isFederationSuperAdmin: true**

> ⏸️ **ADIADO pós-Sprint Federação por demanda urgente**

- [ ] **PM-06.8 — Banco de simulação isolado** (run buttons em `/admin/simulation` congelados via banner amber até implementar)
- [ ] **PM-LGPD** — AuditLog + PII masking + Cloudflare R2

---

## 📋 BLOCO 2 — Painel de Equipes

### Visual / Design System
- [ ] Aplicar novo design system em TODA área `/team/*`
- [ ] Identidade FGB v7 consistente (verde #1B7340, amarelo #F5C200, Barlow Condensed)

### Atletas — área da equipe
- [ ] Reorganizar listagem por categoria (Sub 8, Sub 10, ..., Adulto)
- [ ] Adicionar filtros (categoria, situação, busca por nome)
- [ ] Usar foto de perfil obrigatória do atleta em todas as visualizações

### Cadastro/solicitação de atleta — refatoração
- [ ] Remover campo `registrationCBB` da tela das equipes (só FGB)
- [ ] Upload de foto de perfil OBRIGATÓRIA
- [ ] Organizar formulário em seções (Identificação / Dados pessoais / Documentos / Endereço / Filiação / Esportivo)

#### Campos obrigatórios:
- [ ] Nome completo, data de nascimento, nacionalidade, sexo, estado civil, escolaridade
- [ ] CPF, RG, órgão expedidor RG, data emissão RG
- [ ] Celular
- [ ] Nome da mãe E nome do pai, número de contato (mãe OU pai), seleção de qual
- [ ] Upload: foto do atleta (3x4), CPF digitalizado frente E verso

#### Campos opcionais:
- [ ] Posição, nº camisa, altura, peso, e-mail
- [ ] Endereço completo
- [ ] Certidão de nascimento, outro documento

#### Lógica condicional por idade:
- [ ] Menor de 18: parentContactPhone + parentContactRole obrigatórios
- [ ] Maior de 18: mobile próprio obrigatório

### Inscrições em campeonatos
- [ ] Aplicar novo design system
- [ ] Melhorar fluxo de inscrição
- [ ] Identificar campos novos no momento da inscrição

### Unificar "Competições" e "Campeonatos" no menu
- [ ] Unificar em UM painel "Campeonatos"
- [ ] Abas: "Inscrições abertas" e "Meus campeonatos"

### Membros da equipe — NOVA FUNCIONALIDADE
- [ ] Equipe solicita cadastro de membros (presidente, secretário, diretor)
- [ ] Federação analisa e aprova
- [ ] Status: PENDING → APPROVED / REJECTED

### Organização de sexo dos times
- [ ] Times com atletas masculinos E femininos
- [ ] Times jogam campeonatos masculinos E femininos
- [ ] Refletir no painel admin E no painel equipe

### Ginásios — REAVALIAR
- [ ] Decidir: manter, remover ou renomear?

---

## 📋 BLOCO 3 — Site Principal

### Menu Cabeçalho — Campeonatos
- [ ] "Competições 2026" — sincronizar com sistema
- [ ] "Todos os campeonatos" — listar TODOS do banco
- [ ] "Normas do estadual" — validar conteúdo
- [ ] "Calendário" — sincronizar com jogos
- [ ] Auditar TODA conexão site público ↔ sistema

### Migração de conteúdo do site antigo
- [ ] Analisar https://basquetegaucho.com.br/ completo
- [ ] Listar conteúdo migrável
- [ ] Baixar escudos dos times
- [ ] Adicionar escudos no sistema (Team.logoUrl)
- [ ] Migrar arquivos disponíveis para download

### Página de jogos profissional (inspiração FIBA)
- [ ] Referência: https://www.fiba.basketball/en/events/fiba-europe-cup-25-26/games/128874-SBB-SZOM
- [ ] Organização: campeonato → categoria → jogos
- [ ] Por jogo: placar, escudos, estatísticas, play-by-play, box score
- [ ] Refatorar `/games/[id]/...`

### Visual do site
- [ ] Header com mais imagens profissionais
- [ ] Visual profissional (referência FIBA)

---

## 📋 BLOCO 4 — Financeiro & Faturas (AMPLIADO)

### Unificação Taxas + Faturas
- [ ] REMOVER área de taxas (`/admin/fees`)
- [ ] Manter tudo em "Faturas"
- [ ] Migração de dados se houver

### Visualização detalhada
- [ ] Tela de detalhes da fatura (admin + equipe)
- [ ] Mostrar itens, valores, status, pagamentos, anexos

### Comprovantes de pagamento (NOVO)
- [ ] Schema: tabela `InvoiceAttachment` (ou campo array no Invoice)
- [ ] Upload PDF + imagem (foto do comprovante)
- [ ] Workflow:
  - Equipe anexa → status "AWAITING_CONFIRMATION"
  - Federação confirma → status "PAID"
  - OU rejeita → status "REJECTED" (com motivo)
- [ ] Histórico de comprovantes anexados (audit log)
- [ ] Storage: Cloudflare R2 (depende PM-LGPD)
- [ ] Admin também pode anexar comprovante (quando recebe externamente)

### Sistema de Pagamentos (NOVO)

#### Schema base (gateway-agnóstico)
- [ ] Modelo `Payment` no Prisma
- [ ] Campos: id, invoiceId, amount, status, method, gateway, gatewayPaymentId, gatewayUrl, dueDate, paidAt, installments, installmentNumber
- [ ] Estados: CREATED → PENDING → PAID / FAILED / REFUNDED / CANCELED
- [ ] Histórico de tentativas

#### Adapter pattern
- [ ] Interface `PaymentGateway` (createCharge, getStatus, refund, parseWebhook)
- [ ] `ManualGateway` — admin marca como pago
- [ ] `AsaasGateway` — implementação primária (depois)
- [ ] `BradescoGateway` — futuro distante

#### UI de pagamento
- [ ] Tela "Pagar fatura" (escolhe método + parcelas)
- [ ] Geração de PIX/boleto/link cartão
- [ ] Tela de status do pagamento
- [ ] Tela admin "Receber pagamento manual"

### Parcelamento (NOVO)
- [ ] Schema: `installments` field no Invoice
- [ ] Lógica: divide total em N parcelas com vencimentos mensais
- [ ] Cada parcela vira um `Payment` individual
- [ ] Permitir pagamento antecipado
- [ ] Multa/juros se atrasar (regra a definir)

### Webhook + Notificações
- [ ] Endpoint `/api/webhooks/payments/[gateway]`
- [ ] Validação de assinatura (segurança)
- [ ] Idempotência
- [ ] Atualizar Payment + Invoice automaticamente
- [ ] Notificar equipe (pago/vencer/atrasar)
- [ ] Notificar federação (recebimento)

### Integração Bradesco (FUTURO)
- [ ] Pesquisar Bradesco API Empresarial
- [ ] Contrato corporativo + homologação
- [ ] Implementar `BradescoGateway`
- [ ] Por enquanto: estrutura agnóstica funciona com Asaas

---

## 📋 BLOCO 5 — Geral / Cleanup

- [ ] **Remover IA flutuante** (chat IA no canto do sistema)
- [ ] **Skills/Backend audit** — procurar skills que ajudam na estruturação
- [ ] **Dados reais apenas** — proibir alteração automática; só admin via painel
- [ ] Garantir que rotina de seed não sobrescreva dados reais

---

## 📋 BLOCO 6 — PM-LOGIN (parqueado)

- [ ] Decisão futura: refazer login animado com abordagem nova
- [ ] Branch `feature/login-animated-basketball` preservada (3 commits)
- [ ] 6 mockups HTML guardados (v6 aprovado visualmente)
- [ ] Bug identificado: closure stale + velocidade temporal errada no React/Next
- [ ] Próxima tentativa: simplificar para click-only OU usar react-use-gesture

---

## 📋 BLOCO 7 — Backlog acumulado

### Bugs antigos
- [ ] Motor de agendamento v4.1 — fases como viagens
- [ ] Horários UTC/BRT corretos nos jogos gerados
- [ ] Máx 2 categorias por dia respeitado

### Funcionalidades incompletas
- [ ] Aba Jogos — visualização com horários agrupados
- [ ] RegisterResultButton — modal que atualiza standings
- [ ] Aba Chaveamento — bracket visual por categoria

### Funcionalidades futuras (P3)
- [ ] Galeria de campeões históricos
- [ ] Cestinhas (artilheiros por campeonato)
- [ ] Estatísticas por atleta
- [ ] Relatórios exportáveis (PDF)
- [ ] Chat FGB interno
- [ ] Perfil de atleta com estatísticas
- [ ] Inscrição de atletas online (público)
- [ ] Perfil de coach/comissão técnica
- [ ] Notificações push
- [ ] Newsletter / seguidor da FGB
- [ ] PWA instalável
- [ ] Tela de acompanhamento de jogo ao vivo
- [ ] Multi-federação (outros estados)
- [ ] Integração CBB
- [ ] API pública para mídia
- [ ] Transmissão ao vivo integrada

---

## 📋 BLOCO 8 — Súmula Eletrônica e Mesa (NOVO)

### Auditoria do que já existe
- [ ] Inspecionar `/sumula/[gameId]`
- [ ] Inspecionar `/live/[id]/mesa`
- [ ] Inspecionar `/api/admin/games/[id]/sumula`
- [ ] Decidir: completar o que existe OU refazer do zero (Brayan: existing está incompleto)

### Mesa Eletrônica funcional (META)
- [ ] Interface para árbitro/mesa preencher durante o jogo
- [ ] Registro em tempo real:
  - Pontos por atleta (1, 2, 3)
  - Faltas (individual + coletiva por quarto)
  - Substituições
  - Tempos técnicos
  - Quartos / prorrogação
- [ ] Sincronização Supabase Realtime
- [ ] Funcionamento offline → sync quando voltar internet
- [ ] Tela de placar grande (público/transmissão)
- [ ] Geração de súmula PDF ao final (assinatura digital)

### Upload de Súmula Pronta (FALLBACK necessário)
- [ ] Upload de PDF de súmula gerada externamente
- [ ] Formulário pra admin preencher resultado manualmente:
  - Placar final por quarto
  - Estatísticas por atleta (PTS, FAL, RB, AS, BR, BC)
  - Status do jogo (FINISHED, WO, CANCELED)
- [ ] Armazenar PDF original como anexo do jogo
- [ ] Atualizar automaticamente:
  - Stats individuais por atleta
  - Stats do jogo
  - Standings da categoria/campeonato
  - Histórico do atleta

### Futuramente (P2)
- [ ] OCR + IA pra ler PDF de súmula automaticamente
- [ ] Validação contra súmula da CBB
- [ ] Conferência de elegibilidade de atletas escalados

---

## 📋 BLOCO 9 — Competições Federados e Não-Federados (NOVO)

### Modelo conceitual
- Mesmo campeonato aceita times federados E não-federados MISTURADOS
- Time não-federado: inscrição direto na plataforma (sem registro FGB)
- Atleta não-federado: cadastro completo IGUAL federado, sem `registrationNumber` FGB

### Schema
- [ ] `Championship.acceptsNonFederated: Boolean` (default true)
- [ ] `Team.isFederated: Boolean` (default true pros 18 atuais)
- [ ] `Athlete.registrationNumber: Int?` (já nullable, OK)
- [ ] `Athlete.federationStatus: String?` (já existe, validar)

### Cadastro de team não-federado
- [ ] Endpoint POST `/api/teams/register-guest` (público, sem auth)
- [ ] Captura: nome do time, cidade, responsável, contato, email
- [ ] Status inicial: PENDING_VERIFICATION
- [ ] Federação aprova/rejeita
- [ ] Login simples pra time não-federado gerir atletas

### Inscrição em campeonato
- [ ] Workflow: federado OU não-federado pode se inscrever
- [ ] Se campeonato `acceptsNonFederated: false` → bloqueia não-federados
- [ ] Validação de atletas elegíveis
- [ ] Taxa diferenciada (decidir com Brayan)

### Visual / Identificação
- [ ] Badge "Federado" / "Não-Federado" nos times
- [ ] Filtro nas listagens
- [ ] Estatística separada

### Validações
- [ ] Time não-federado SEM acesso a:
  - Carteirinha FGB
  - Seleção gaúcha
  - Histórico de federação
- [ ] Atletas não-federados não aparecem em rankings oficiais FGB

---

## 🗓️ ORDEM DE EXECUÇÃO RECOMENDADA

### Sprint 1 — Fechar PM-06
1. PM-06.4 merge (5min)
2. PM-06.7 super-admin Brayan (5min)
3. PM-06.5 audit staff (1h)
4. PM-06.6 criar 18 users (1h)
5. PM-LGPD escopar (próxima sessão dedicada)

### Sprint 2 — Cleanup + Financeiro fundação
1. Remover IA flutuante
2. Unificar Taxas e Faturas
3. Tela de detalhes da fatura
4. Schema Payment + Adapter pattern (sem gateway real)
5. Upload de comprovantes (depende R2/PM-LGPD)

### Sprint 3 — Painel de Equipes
1. Aplicar design system em /team/*
2. Refatorar cadastro de atleta
3. Reorganizar listagem por categoria
4. Unificar competições/campeonatos no menu
5. Membros da equipe
6. Organização de sexo dos times

### Sprint 4 — Site Principal
1. Migrar conteúdo do site antigo + escudos
2. Conectar menu campeonatos
3. Refatorar página de jogos (FIBA-style)
4. Melhorar visual

### Sprint 5 — Súmula e Mesa (BLOCO 8)
1. Auditar existing
2. Refazer mesa eletrônica funcional
3. Upload de súmula pronta como fallback
4. Atualização automática de stats

### Sprint 6 — Competições não-federadas (BLOCO 9)
1. Schema changes
2. Cadastro de team guest
3. Workflow de inscrição
4. UI / badges

### Sprint 7 — Gateway de pagamento real
1. Implementar AsaasGateway
2. Webhook + idempotência
3. Parcelamento
4. Testes em sandbox

### Sprint 8+ — Backlog e futuras
1. Motor de agendamento v4.1
2. Bracket visual
3. PM-LOGIN refeito
4. Backlog P3 conforme demanda

---

## 📝 LOG DE DECISÕES

### Decisões fixadas (não revisitar)
- 15 categorias globais (Sub 8 → Sub 21 + Adulto)
- Cloudflare R2 (10GB grátis) para storage
- Senha users iniciais: bcrypt(`mudar123`) + `mustChangePassword: true`
- Federação tem painel admin total com auditoria (NÃO impersonation)
- Email institucional dos clubes em `Team.institutionalEmail`
- LGPD: counts e booleans em responses, nunca PII
- MIGRATE_TOKEN sempre via `Read-Host -AsSecureString`
- Atletas <18: parentContact obrigatório; ≥18: mobile obrigatório
- Filiação: OR (mãe OU pai)
- CPF digital: (front+back) novo OU legacy
- RG digital: front+back ambos obrigatórios
- **Pagamento**: arquitetura agnóstica. Asaas primeiro, Bradesco futuro
- **Federados+não-federados**: mesmo campeonato aceita os 2 misturados
- **Atleta não-federado**: cadastro completo igual federado, só sem registrationNumber
- **Comprovantes**: aceita PDF + imagem
- **Súmula**: refazer mesa eletrônica + permitir upload de súmula pronta como fallback
- **Asaas**: confirmado gateway primário (Bradesco fica como futuro distante)
- **Ginásios**: remover (dead code confirmado — não há fluxo ativo nem dependência)
- **Banco de simulação isolado (PM-06.8)**: ADIADO pós-Sprint Federação — run buttons em `/admin/simulation` congelados (disabled + banner amber) até implementação
- **BLOCO 8 ordem**: upload de PDF de súmula pronta primeiro (fallback), mesa eletrônica completa em momento posterior

### Padrões de desenvolvimento
- Branch nova por feature (não direto na main)
- Snippet → revisão Brayan → commit
- Antigravity para antes de commit/push/PR/merge
- Antigravity não faz workarounds, reporta limite
- Sempre verificar padrão real do código antes de aplicar
- LGPD-safe em todos endpoints

---

**FIM DO DOCUMENTO**

Este arquivo é a fonte da verdade do projeto.
