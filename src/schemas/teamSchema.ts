import { z } from 'zod'

const trimmedString = (message: string, min = 1) =>
  z.string().trim().min(min, message)

const gymSchema = z.object({
  name: trimmedString('Informe o nome do ginasio', 3),
  address: trimmedString('Informe o endereco completo', 5),
  city: trimmedString('Informe a cidade do ginasio', 2),
  capacity: z.coerce.number().int().positive('Informe a capacidade do ginasio'),
  availability: trimmedString('Informe a disponibilidade do ginasio', 3),
  canHost: z.boolean().optional().default(true),
})

export const createTeamSchema = z.object({
  name: trimmedString('Nome da equipe deve ter pelo menos 3 caracteres', 3),
  sex: z.enum(['masculino', 'feminino', 'misto']),
  city: trimmedString('Informe a cidade', 2),
  state: trimmedString('Informe o estado', 2).default('RS'),
  phone: trimmedString('Informe um telefone de contato', 8),
  responsible: trimmedString('Informe o responsavel principal', 3),
  logoUrl: z.string().trim().url('URL invalida').optional().or(z.literal('')).nullable(),
  hasGym: z.boolean().optional().default(false),
  gym: gymSchema.optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.hasGym && !data.gym) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['gym'],
      message: 'Preencha os dados do ginasio ou desative a opcao de ginasio proprio.',
    })
  }

  if (!data.hasGym && data.gym) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hasGym'],
      message: 'Ative a opcao de ginasio proprio para salvar dados de sede.',
    })
  }
})

export const joinTeamSchema = z.object({
  teamId: z.string().uuid('ID invalido'),
  role: z.string().optional().default('STAFF_OTHER'),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type JoinTeamInput = z.infer<typeof joinTeamSchema>
