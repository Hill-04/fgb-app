import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { CreateTeamInput } from '@/schemas/teamSchema'

export class TeamService {
  static async createTeam(userId: string, input: CreateTeamInput) {
    try {
      // Check if user already has an active team
      const existingMembership = await prisma.teamMembership.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      })

      if (existingMembership) {
        throw new Error('Você já pertence a uma equipe')
      }

      // Check if team name already exists
      const existingTeam = await prisma.team.findUnique({
        where: { name: input.name }
      })

      if (existingTeam) {
        throw new Error('Já existe uma equipe com este nome')
      }

      // Create team + membership + gym in transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create team
        const team = await tx.team.create({
          data: {
            name: input.name,
            logoUrl: input.logoUrl || null,
            city: input.gym?.city || null,
            state: 'RS',
            phone: null,
            sex: null
          }
        })

        // 2. Create gym if provided
        if (input.hasGym && input.gym) {
          await tx.gym.create({
            data: {
              name: input.gym.name,
              address: input.gym.address,
              city: input.gym.city,
              capacity: typeof input.gym.capacity === 'string'
                ? parseInt(input.gym.capacity)
                : input.gym.capacity,
              availability: input.gym.availability,
              canHost: true,
              teamId: team.id
            }
          })
        }

        // 3. Create membership as HEAD_COACH
        const membership = await tx.teamMembership.create({
          data: {
            userId,
            teamId: team.id,
            role: 'HEAD_COACH',
            status: 'ACTIVE',
            approvedAt: new Date()
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

  static async joinTeam(userId: string, teamId: string) {
    try {
      // Check if user already has active membership
      const existingMembership = await prisma.teamMembership.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'PENDING'] } }
      })

      if (existingMembership) {
        throw new Error('Você já tem uma solicitação pendente ou está em uma equipe')
      }

      // Create pending membership request
      const membership = await prisma.teamMembership.create({
        data: {
          userId,
          teamId,
          role: 'AUXILIAR',
          status: 'PENDING'
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

  static async approveMember(teamId: string, userId: string, approverId: string) {
    try {
      // Verify approver is HEAD_COACH or ADMIN
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

      // Update membership to ACTIVE
      const membership = await prisma.teamMembership.update({
        where: {
          userId
        },
        data: {
          status: 'ACTIVE',
          approvedAt: new Date()
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
      // Verify rejecter is HEAD_COACH or ADMIN
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

      // Update membership to REJECTED
      const membership = await prisma.teamMembership.update({
        where: {
          userId
        },
        data: {
          status: 'REJECTED'
        }
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
