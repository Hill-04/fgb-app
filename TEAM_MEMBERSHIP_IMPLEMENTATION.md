# Sistema de Membership de Equipes - FGB App

## 📊 Status da Implementação: 85% Completo

Esta branch contém a reestruturação completa do sistema de usuários e equipes do FGB App, implementando o conceito de **membership** (usuários que pertencem a equipes com papéis específicos).

---

## ✅ O Que Foi Implementado (85%)

### 1. **Schema Prisma - 100% Completo**

#### Novos Enums:
```prisma
enum TeamRole {
  HEAD_COACH          // Dono da equipe, acesso total
  ADMIN               // Pode gerenciar membros e inscrições
  AUXILIAR            // Acesso de visualização e suporte
  PREPARADOR_FISICO   // Acesso à parte física
  MEDICO              // Acesso à parte médica
  OUTRO               // Acesso básico
}

enum MembershipStatus {
  PENDING   // Solicitação pendente
  ACTIVE    // Membro ativo
  REJECTED  // Solicitação recusada
  INACTIVE  // Saiu ou foi removido
}
```

#### Modelo User Refatorado:
```prisma
model User {
  id          String          @id @default(uuid())
  name        String          // NOVO: nome completo
  email       String          @unique
  password    String
  defaultRole TeamRole        @default(AUXILIAR)  // NOVO: papel padrão
  isAdmin     Boolean         @default(false)     // NOVO: acesso admin FGB
  membership  TeamMembership? // NOVO: relação 1:1 com equipe
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

#### Modelo Team Refatorado:
```prisma
model Team {
  id             String           @id @default(uuid())
  name           String           @unique
  logoUrl        String?          // NOVO: upload de logo
  city           String?          // Agora opcional
  state          String?          @default("RS")
  phone          String?
  sex            String?
  members        TeamMembership[] // NOVO: múltiplos membros
  gym            Gym?
  registrations  Registration[]
  homeGames      Game[]           @relation("HomeTeam")
  awayGames      Game[]           @relation("AwayTeam")
  standings      Standing[]
  notifications  Notification[]
  sentMessages   Message[]        @relation("SentMessages")
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
}
```

#### Novo Modelo TeamMembership:
```prisma
model TeamMembership {
  id          String           @id @default(uuid())
  userId      String           @unique  // 1 usuário = 1 equipe ativa
  teamId      String
  role        TeamRole         // Papel do membro
  status      MembershipStatus @default(PENDING)
  user        User             @relation(fields: [userId], references: [id])
  team        Team             @relation(fields: [teamId], references: [id])
  requestedAt DateTime         @default(now())
  approvedAt  DateTime?
  updatedAt   DateTime         @updatedAt
}
```

---

### 2. **NextAuth Atualizado - 100% Completo**

**Arquivo:** `src/lib/auth.ts`

#### Callbacks JWT e Session:
```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id
      token.name = user.name
      token.isAdmin = user.isAdmin
      token.teamId = user.membership?.team.id || null
      token.teamName = user.membership?.team.name || null
      token.teamRole = user.membership?.role || null
    }
    return token
  },
  async session({ session, token }) {
    session.user.id = token.id
    session.user.name = token.name
    session.user.isAdmin = token.isAdmin
    session.user.teamId = token.teamId
    session.user.teamName = token.teamName
    session.user.teamRole = token.teamRole
    return session
  }
}
```

---

### 3. **APIs Criadas - 100% Completo**

#### `POST /api/teams/create`
Cria uma nova equipe e define o criador como HEAD_COACH.

**Request:**
```json
{
  "name": "Caxias Basquete",
  "logoUrl": "https://...",
  "hasGym": true,
  "gym": {
    "name": "Ginásio Municipal",
    "address": "Rua X, 123",
    "city": "Caxias do Sul",
    "capacity": 500,
    "availability": "sabado_domingo"
  }
}
```

**Response:**
```json
{
  "success": true,
  "team": { ... },
  "membership": { ... }
}
```

---

#### `POST /api/teams/[id]/join`
Solicita entrada em uma equipe existente.

**Response:**
```json
{
  "success": true,
  "membership": {
    "id": "...",
    "status": "PENDING",
    "role": "AUXILIAR",
    "team": { ... }
  }
}
```

---

#### `POST /api/teams/[id]/members/[userId]/approve`
Aprova solicitação de entrada (apenas HEAD_COACH ou ADMIN).

**Request:**
```json
{
  "role": "PREPARADOR_FISICO"
}
```

**Response:**
```json
{
  "success": true,
  "membership": {
    "status": "ACTIVE",
    "role": "PREPARADOR_FISICO",
    "approvedAt": "2026-03-10T..."
  }
}
```

---

#### `POST /api/teams/[id]/members/[userId]/reject`
Recusa solicitação de entrada (apenas HEAD_COACH ou ADMIN).

---

#### `GET /api/teams?search=nome`
Lista equipes para busca.

**Response:**
```json
{
  "teams": [
    {
      "id": "...",
      "name": "Caxias Basquete",
      "logoUrl": "...",
      "city": "Caxias do Sul",
      "state": "RS",
      "_count": {
        "members": 5
      }
    }
  ]
}
```

---

### 4. **Páginas Criadas - 100% Completo**

#### `/team/onboarding`
Tela de boas-vindas para usuários sem equipe.

**Funcionalidades:**
- Detecta se usuário tem equipe ativa
- Redireciona para dashboard se tiver equipe
- Oferece duas opções:
  - Criar minha equipe
  - Entrar em uma equipe existente

---

#### `/team/create`
Formulário completo de criação de equipe.

**Campos:**
- Nome da equipe (obrigatório)
- URL do logótipo (opcional)
- Possui ginásio próprio? (checkbox)
  - Se sim: nome, endereço, cidade, capacidade, disponibilidade

**Comportamento:**
- Verifica se usuário já tem equipe ativa
- Verifica se nome já existe
- Cria equipe + membership HEAD_COACH em transação
- Redireciona para `/team/dashboard`

---

#### `/team/join`
Busca e solicitação de entrada em equipes.

**Funcionalidades:**
- Busca por nome de equipe
- Exibe lista de equipes com logo, cidade e nº de membros
- Botão "Solicitar Entrada"
- Validações:
  - Não pode ter equipe ativa
  - Não pode ter solicitação pendente para a mesma equipe
- Mensagem de sucesso com orientações

---

## ⏳ O Que Falta Implementar (15%)

### 1. **Simplificar Página `/register`**
**Status:** Não iniciado

A página atual cria equipe + usuário simultaneamente. Deve ser simplificada para criar APENAS o usuário.

**Campos necessários:**
- Nome completo
- Email
- Senha
- Papel padrão (dropdown): Auxiliar, Preparador Físico, Médico, Outro

**Fluxo:**
```
Registro → Login → Onboarding → Criar/Entrar em Equipe
```

---

### 2. **Atualizar API `/api/register`**
**Status:** Não iniciado

**Localização:** `src/app/api/register/route.ts`

Deve criar apenas o usuário:
```typescript
await prisma.user.create({
  data: {
    name,
    email,
    password: hashedPassword,
    defaultRole, // do formulário
    isAdmin: false
  }
});
```

---

### 3. **Redirect Pós-Login**
**Status:** Não iniciado

**Lógica:**
```typescript
if (session.user.teamId) {
  redirect('/team/dashboard')
} else {
  redirect('/team/onboarding')
}
```

**Localização:** Página `/login` ou middleware

---

### 4. **Seção de Gerenciamento de Membros no Dashboard**
**Status:** Não iniciado

**Localização:** `/team/dashboard`

**Funcionalidades:**
- Listar membros ativos com seus papéis
- Listar solicitações pendentes
- Botões Aprovar / Recusar (com dropdown de papel)
- Alterar papel de membros existentes
- Remover membro (status → INACTIVE)

**Permissões:**
- Visível apenas para HEAD_COACH e ADMIN

---

### 5. **Script de Migração SQL**
**Status:** Não iniciado

Como o banco Turso está em produção com dados reais, é necessário:

1. Backup completo do banco atual
2. Script SQL para migração:
   ```sql
   -- Backup de Users/Teams existentes
   -- Dropar tabelas antigas
   -- Recriar com novo schema (npx prisma db push)
   -- Popular com dados migrados
   ```

3. Atualizar seed.ts para criar TeamMemberships

---

### 6. **Atualizar Seed**
**Status:** Não iniciado

**Localização:** `prisma/seed.ts`

O seed atual cria relação direta User → Team. Deve criar:
- Users com novo schema
- Teams
- TeamMemberships (com status ACTIVE)

---

## 📁 Arquivos Criados/Modificados

### Criados:
```
✅ src/app/api/teams/create/route.ts
✅ src/app/api/teams/[id]/join/route.ts
✅ src/app/api/teams/[id]/members/[userId]/approve/route.ts
✅ src/app/api/teams/[id]/members/[userId]/reject/route.ts
✅ src/app/api/teams/route.ts
✅ src/app/team/onboarding/page.tsx
✅ src/app/team/create/page.tsx
✅ src/app/team/join/page.tsx
✅ TEAM_MEMBERSHIP_IMPLEMENTATION.md (este arquivo)
```

### Modificados:
```
✅ prisma/schema.prisma (BREAKING CHANGE)
✅ src/lib/auth.ts
```

### Pendentes de Modificação:
```
⏳ src/app/register/page.tsx
⏳ src/app/api/register/route.ts
⏳ src/app/login/page.tsx (redirect)
⏳ src/app/team/dashboard/page.tsx (seção de membros)
⏳ prisma/seed.ts
```

---

## ⚠️ IMPORTANTE - Estado Atual

### ❌ O Projeto NÃO Está Funcional

**Motivos:**
1. Schema do banco não foi migrado (estrutura antiga ≠ nova)
2. Página `/register` ainda usa schema antigo
3. API `/api/register` usa schema antigo
4. Sem migration, qualquer tentativa de cadastro/login quebra

### ✅ Para Tornar Funcional:

1. Finalizar os 15% restantes (est. 1-2h)
2. Rodar migration no banco (local e Turso)
3. Testar fluxo completo:
   - Registro de usuário
   - Login
   - Onboarding
   - Criar equipe
   - Solicitar entrada em equipe
   - Aprovar/recusar membros

---

## 🧪 Como Testar (Após Finalização)

### 1. Limpar banco local:
```bash
cd fgb-app
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

### 2. Testar fluxo de criação de equipe:
1. Registrar novo usuário em `/register`
2. Fazer login
3. Deve redirecionar para `/team/onboarding`
4. Clicar em "Criar Minha Equipe"
5. Preencher formulário em `/team/create`
6. Deve redirecionar para `/team/dashboard`
7. Verificar que é HEAD_COACH

### 3. Testar fluxo de entrada em equipe:
1. Registrar outro usuário
2. Fazer login
3. Ir para `/team/onboarding`
4. Clicar em "Entrar em uma Equipe"
5. Buscar equipe criada no teste anterior
6. Solicitar entrada
7. Logout
8. Login com HEAD_COACH da equipe
9. No dashboard, ver solicitação pendente
10. Aprovar com papel específico
11. Logout e login com novo membro
12. Verificar acesso ao dashboard da equipe

---

## 🚀 Próximos Passos

1. **Finalizar 15% restantes** (ver seção "O Que Falta Implementar")
2. **Testar localmente** com banco limpo
3. **Criar migration para Turso** com backup dos dados
4. **Atualizar documentação** de uso
5. **Merge em `main`** após testes completos

---

## 📝 Notas Técnicas

### Regras de Negócio Implementadas:

1. ✅ Um usuário só pode ter uma membership ACTIVE por vez
2. ✅ HEAD_COACH é atribuído automaticamente ao criador da equipe
3. ✅ Não é possível criar equipe se já tiver uma ativa
4. ✅ Não é possível solicitar entrada em equipe se já tiver uma ativa
5. ✅ Não é possível solicitar entrada duas vezes na mesma equipe
6. ✅ Apenas HEAD_COACH e ADMIN podem aprovar/recusar membros

### Regras Pendentes:

1. ⏳ HEAD_COACH não pode sair sem transferir papel ou deletar equipe
2. ⏳ HEAD_COACH é único por equipe
3. ⏳ Apenas HEAD_COACH e ADMIN podem fazer inscrições em campeonatos

---

## 🤝 Contribuindo

Para continuar o desenvolvimento:

1. Checkout desta branch:
   ```bash
   git checkout feature/team-membership-system
   ```

2. Instalar dependências:
   ```bash
   cd fgb-app
   npm install
   ```

3. Gerar Prisma Client:
   ```bash
   npx prisma generate
   ```

4. Implementar itens pendentes (ver seção "O Que Falta")

5. Testar localmente

6. Commit e push:
   ```bash
   git add .
   git commit -m "feat: complete team membership system"
   git push origin feature/team-membership-system
   ```

---

**Data de Criação:** 10 de Março de 2026
**Status:** 85% Completo
**Estimativa para Finalização:** 1-2 horas
**Branch:** `feature/team-membership-system`
