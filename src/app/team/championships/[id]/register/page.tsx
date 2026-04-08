import { prisma } from '@/lib/db'
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
      <div className="space-y-4 font-sans">
        <h1 className="text-4xl font-black text-[var(--black)] uppercase italic">Erro</h1>
        <p className="text-red-500 font-medium">Campeonato não encontrado.</p>
      </div>
    )
  }

  if (championship.status !== 'REGISTRATION_OPEN') {
    return (
      <div className="space-y-4 font-sans">
        <h1 className="text-4xl font-black text-[var(--black)] uppercase italic">Inscrições Fechadas</h1>
        <p className="text-[var(--gray)] font-medium">Este campeonato não está aceitando inscrições no momento.</p>
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
      <div className="space-y-4 font-sans">
        <h1 className="text-4xl font-black text-[var(--black)] uppercase italic">Erro</h1>
        <p className="text-red-500 font-medium">Equipe não encontrada.</p>
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
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-4xl font-black text-[var(--black)] mb-2 uppercase italic">
            Inscrição Já Realizada
          </h1>
          <p className="text-[var(--gray)] font-medium">
            Sua equipe já está inscrita neste campeonato.
          </p>
        </div>
        <div className="fgb-card bg-white border border-[var(--border)] p-6 rounded-3xl shadow-sm">
          <p className="text-[var(--gray)] mb-4 font-medium uppercase tracking-widest text-xs">
            Status: <span className="text-orange-600 font-bold ml-1">{existingRegistration.status}</span>
          </p>
          <a href="/team/dashboard" className="text-orange-600 hover:text-orange-700 font-bold text-sm tracking-tight hover:underline transition-all">
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
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-black text-[var(--black)] mb-2 uppercase italic tracking-tight">
          Inscrição — {championship.name}
        </h1>
        <p className="text-[var(--gray)] font-medium">
          Complete as 4 seções abaixo para inscrever sua equipe no campeonato.
        </p>
      </div>

      {/* Info Banner */}
      <div className="fgb-card bg-orange-50 p-6 border border-orange-200 rounded-3xl shadow-inner relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-orange-400" />
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 border border-orange-200 shadow-sm text-xl text-orange-600">
            ⚠️
          </div>
          <div>
            <h3 className="font-bold text-[var(--black)] mb-1 uppercase tracking-tight">Esta é a tela mais importante para equipes</h3>
            <p className="text-sm text-orange-800/80 font-medium leading-relaxed">
              Preencha todos os dados com atenção. Após a confirmação, sua inscrição será validada pela FGB.
              Mínimo de <span className="text-orange-600 font-bold mx-1">{championship.minTeamsPerCat} equipes por categoria</span> para o campeonato acontecer.
            </p>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <RegistrationForm
        championship={championship}
        team={team as any}
        holidays={holidays}
      />
    </div>
  )
}
