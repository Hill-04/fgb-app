import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { CreateTeamInput } from '@/schemas/teamSchema'

export class TeamService {
  static async createTeam(userId: string, input: CreateTeamInput) {
    try {
      const existingMembership = await prisma.teamMembership.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'PENDING'] } }
      })

      if (existingMembership) {
        throw new Error('Você já pertence a uma equipe ou tem uma solicitação pendente')
      }

      const existingTeam = await prisma.team.findUnique({
        where: { name: input.name }
      })

      if (existingTeam) {
        throw new Error('Já existe uma equipe com este nome')
      }

      const result = await prisma.$transaction(async (tx) => {
        const team = await tx.team.create({
          data: {
            name: input.name,
            logoUrl: input.logoUrl ?? null,
            city: input.city,
            state: input.state ?? 'RS',
            phone: input.phone,
            sex: input.sex,
            responsible: input.responsible,
          }
        })

        if (input.hasGym && input.gym) {
          await tx.gym.create({
            data: {
              name: input.gym.name,
              address: input.gym.address,
              city: input.gym.city,
              capacity: typeof input.gym.capacity === 'string'
                ? parseInt(input.gym.capacity as string)
                : input.gym.capacity as number,
              availability: input.gym.availability,
              canHost: input.gym.canHost ?? true,
              teamId: team.id
            }
          })
        }

        const membership = await tx.teamMembership.create({
          data: {
            userId,
            teamId: team.id,
            role: 'HEAD_COACH',
            status: 'ACTIVE',
            approvedAt: new Date(),
            updatedAt: new Date(),
          }
        })

        return { team, membership }
      })

      logger.info('Team created successfully', {
        teamId: result.team.id,
        userId,
        teamName: result.team.name
      })

      return result

    } catch (error) {
      logger.error('Failed to create team', { userId, error })
      throw error
    }
  }

  static async joinTeam(userId: string, teamId: string, role = 'STAFF_OTHER') {
    try {
      const existingMembership = await prisma.teamMembership.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'PENDING'] } }
      })

      if (existingMembership) {
        throw new Error('Você já tem uma solicitação pendente ou está em uma equipe')
      }

      const membership = await prisma.teamMembership.create({
        data: {
          userId,
          teamId,
          role,
          status: 'PENDING',
          updatedAt: new Date(),
        },
        include: {
          team: true,
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      logger.info('Join team request created', { userId, teamId })
      return membership

    } catch (error) {
      logger.error('Failed to join team', { userId, teamId, error })
      throw error
    }
  }

  static async cancelRequest(userId: string) {
    try {
      const membership = await prisma.teamMembership.findFirst({
        where: { userId, status: 'PENDING' }
      })

      if (!membership) {
        throw new Error('Nenhuma solicitação pendente encontrada')
      }

      await prisma.teamMembership.update({
        where: { id: membership.id },
        data: { status: 'CANCELLED', updatedAt: new Date() }
      })

      logger.info('Join request cancelled', { userId })
    } catch (error) {
      logger.error('Failed to cancel request', { userId, error })
      throw error
    }
  }

  static async approveMember(teamId: string, userId: string, approverId: string) {
    try {
      const approverMembership = await prisma.teamMembership.findFirst({
        where: {
          userId: approverId,
          teamId,
          status: 'ACTIVE',
          role: { in: ['HEAD_COACH', 'ADMIN'] }
        }
      })

      if (!approverMembership) {
        throw new Error('Você não tem permissão para aprovar membros')
      }

      const pending = await prisma.teamMembership.findFirst({
        where: { userId, teamId, status: 'PENDING' }
      })

      if (!pending) {
        throw new Error('Solicitação pendente não encontrada')
      }

      const membership = await prisma.teamMembership.update({
        where: { id: pending.id },
        data: {
          status: 'ACTIVE',
          approvedAt: new Date(),
          updatedAt: new Date(),
        }
      })

      logger.info('Member approved', { teamId, userId, approverId })
      return membership

    } catch (error) {
      logger.error('Failed to approve member', { teamId, userId, approverId, error })
      throw error
    }
  }

  static async rejectMember(teamId: string, userId: string, rejecterId: string) {
    try {
      const rejecterMembership = await prisma.teamMembership.findFirst({
        where: {
          userId: rejecterId,
          teamId,
          status: 'ACTIVE',
          role: { in: ['HEAD_COACH', 'ADMIN'] }
        }
      })

      if (!rejecterMembership) {
        throw new Error('Você não tem permissão para recusar membros')
      }

      const pending = await prisma.teamMembership.findFirst({
        where: { userId, teamId, status: 'PENDING' }
      })

      if (!pending) {
        throw new Error('Solicitação pendente não encontrada')
      }

      const membership = await prisma.teamMembership.update({
        where: { id: pending.id },
        data: { status: 'REJECTED', updatedAt: new Date() }
      })

      logger.info('Member rejected', { teamId, userId, rejecterId })
      return membership

    } catch (error) {
      logger.error('Failed to reject member', { teamId, userId, rejecterId, error })
      throw error
    }
  }

  static async listTeams() {
    try {
      const teams = await prisma.team.findMany({
        select: {
          id: true,
          name: true,
          logoUrl: true,
          city: true,
          state: true,
          sex: true,
          _count: {
            select: { members: true }
          }
        },
        orderBy: { name: 'asc' }
      })

      return teams
    } catch (error) {
      logger.error('Failed to list teams', error)
      throw error
    }
  }
}
