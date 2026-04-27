import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ChevronLeft } from 'lucide-react'

import { TeamAthleteRequestForm } from '@/components/athletes/team-athlete-request-form'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TeamAthleteNewPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') redirect('/login')
  if (!(session.user as any).teamId) redirect('/team/onboarding')

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/team/athletes"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:text-[var(--black)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para atletas
        </Link>
        <p className="fgb-label mt-4 text-[var(--verde)]" style={{ fontSize: 10 }}>Nova solicitacao</p>
        <h1 className="fgb-display mt-2 text-3xl leading-none text-[var(--black)]">Cadastro federativo de atleta</h1>
        <p className="mt-2 text-sm font-medium text-[var(--gray)]">
          Preencha os dados do atleta e envie a solicitacao para analise da federacao.
        </p>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <TeamAthleteRequestForm />
      </div>
    </div>
  )
}
