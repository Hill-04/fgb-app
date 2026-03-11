import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import type { CreateUserInput } from '@/schemas/userSchema'

export class UserService {
  static async createUser(input: CreateUserInput) {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email }
      })

      if (existingUser) {
        throw new Error('E-mail já está em uso')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          defaultRole: input.defaultRole,
          isAdmin: false
        },
        select: {
          id: true,
          name: true,
          email: true,
          defaultRole: true,
          isAdmin: true,
          createdAt: true
        }
      })

      logger.info('User created successfully', { userId: user.id, email: user.email })
      return user

    } catch (error) {
      logger.error('Failed to create user', error)
      throw error
    }
  }

  static async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          membership: {
            where: { status: 'ACTIVE' },
            include: { team: true }
          }
        }
      })

      return user
    } catch (error) {
      logger.error('Failed to get user by ID', { userId, error })
      throw error
    }
  }

  static async getUserByEmail(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          membership: {
            where: { status: 'ACTIVE' },
            include: { team: true }
          }
        }
      })

      return user
    } catch (error) {
      logger.error('Failed to get user by email', { email, error })
      throw error
    }
  }
}
