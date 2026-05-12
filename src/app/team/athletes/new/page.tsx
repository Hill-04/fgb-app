import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ChevronLeft, UserPlus } from 'lucide-react'

import { TeamAthleteRequestForm } from '@/components/athletes/team-athlete-request-form'
import { TeamPageHeader } from '@/components/team/team-page-header'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TeamAthleteNewPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') redirect('/login')
  if (!(session.user as any).teamId) redirect('/team/onboarding')

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans px-4 sm:px-6">
      <Link
        href="/team/athletes"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:text-[var(--black)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para atletas
      </Link>

      <TeamPageHeader
        eyebrow="Nova solicitação"
        title="Cadastro federativo de atleta"
        description="Preencha os dados do atleta e envie a solicitação para análise da federação."
        icon={<UserPlus className="w-4 h-4" />}
      />

      <TeamAthleteRequestForm />
    </div>
  )
}
