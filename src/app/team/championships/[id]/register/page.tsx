import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Section } from '@/components/Section'
import { RegistrationForm } from './RegistrationForm'

export const dynamic = 'force-dynamic'

export default async function ChampionshipRegisterPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') {
    redirect('/login')
  }

  const { id: championshipId } = await params
  const teamId = (session.user as any).teamId

  // Fetch championship data
  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    include: {
      categories: true,
      _count: {
        select: { registrations: true }
      }
    }
  })

  if (!championship) {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-[--text-main]">Erro</h1>
        <p className="text-red-400">Campeonato não encontrado.</p>
      </div>
    )
  }

  if (championship.status !== 'REGISTRATION_OPEN') {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-[--text-main]">Inscrições Fechadas</h1>
        <p className="text-[--text-secondary]">Este campeonato não está aceitando inscrições no momento.</p>
      </div>
    )
  }

  // Fetch team data with gym
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { gym: true }
  })

  if (!team) {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-[--text-main]">Erro</h1>
        <p className="text-red-400">Equipe não encontrada.</p>
      </div>
    )
  }

  // Check if team already registered
  const existingRegistration = await prisma.registration.findFirst({
    where: {
      championshipId,
      teamId
    }
  })

  if (existingRegistration) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-black text-[--text-main] mb-2">
            Inscrição Já Realizada
          </h1>
          <p className="text-[--text-secondary]">
            Sua equipe já está inscrita neste campeonato.
          </p>
        </div>
        <div className="card-fgb p-6">
          <p className="text-[--text-secondary] mb-4">
            Status: <span className="text-[--orange] font-semibold">{existingRegistration.status}</span>
          </p>
          <a href="/team/dashboard" className="text-[--orange] hover:text-[--orange-hover] font-semibold">
            ← Voltar ao Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Fetch holidays for the championship period
  const currentYear = new Date().getFullYear()
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: new Date(`${currentYear}-01-01`),
        lte: new Date(`${currentYear + 1}-12-31`)
      }
    },
    orderBy: { date: 'asc' }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-[--text-main] mb-2">
          Inscrição — {championship.name}
        </h1>
        <p className="text-[--text-secondary]">
          Complete as 4 seções abaixo para inscrever sua equipe no campeonato.
        </p>
      </div>

      {/* Info Banner */}
      <div className="card-fgb p-6 border-l-4 border-[--orange]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[--orange]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[--orange]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[--text-main] mb-1">Esta é a tela mais importante para equipes</h3>
            <p className="text-sm text-[--text-secondary]">
              Preencha todos os dados com atenção. Após a confirmação, sua inscrição será validada pela FGB.
              Mínimo de <span className="text-[--orange] font-semibold">{championship.minTeamsPerCat} equipes por categoria</span> para o campeonato acontecer.
            </p>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <RegistrationForm
        championship={championship}
        team={team}
        holidays={holidays}
      />
    </div>
  )
}
