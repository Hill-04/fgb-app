import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(3, 'Nome da equipe deve ter pelo menos 3 caracteres'),
  logoUrl: z.string().url('URL inválida').optional().nullable(),
  hasGym: z.boolean().optional(),
  gym: z.object({
    name: z.string().min(3),
    address: z.string().min(5),
    city: z.string().min(2),
    capacity: z.number().int().positive().or(z.string().transform(Number)),
    availability: z.string()
  }).optional().nullable()
})

export const joinTeamSchema = z.object({
  teamId: z.string().uuid('ID inválido')
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type JoinTeamInput = z.infer<typeof joinTeamSchema>
