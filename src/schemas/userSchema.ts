import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  defaultRole: z.enum(['HEAD_COACH', 'ADMIN', 'AUXILIAR', 'PREPARADOR_FISICO', 'MEDICO', 'OUTRO'])
})

export type CreateUserInput = z.infer<typeof createUserSchema>
