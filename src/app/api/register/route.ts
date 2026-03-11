import { NextResponse } from 'next/server'
import { createUserSchema } from '@/schemas/userSchema'
import { UserService } from '@/services/userService'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const validationResult = createUserSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Create user through service layer
    const user = await UserService.createUser(validationResult.data)

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      userId: user.id
    })

  } catch (error) {
    logger.error('Registration API error', error)

    const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar usuário'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
