import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Trophy, Calendar, Users, CheckCircle2, ChevronRight } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TeamChampionshipsPage() {
  const session = await getServerSession(authOptions)
  const teamId = (session?.user as any)?.teamId

  try {
    const championships = await (prisma.championship.findMany({
      where: { 
        status: 'REGISTRATION_OPEN',
        isSimulation: false
      } as any,
      orderBy: { createdAt: 'desc' },
      include: {
        categories: {
          include: { _count: { select: { registrations: true } } }
        },
        _count: { select: { registrations: true } },
        registrations: teamId ? {
          where: { teamId }
        } : false
      } as any
    }) as any)

    return (
      <div className="space-y-10 max-w-5xl mx-auto font-sans px-4 sm:px-6">
        <div className="animate-fade-in border-b border-[var(--border)] pb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
              <Trophy className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-[var(--gray)] font-bold uppercase tracking-widest text-[10px]">Inscrições Disponíveis</span>
          </div>
          <h1 className="text-4xl font-display font-black text-[var(--black)] tracking-tight italic uppercase">Campeonatos</h1>
          <p className="text-[var(--gray)] mt-2 font-medium">Campeonatos com inscrições abertas para sua equipe.</p>
        </div>

        {championships.length === 0 ? (
          <div className="fgb-card bg-[var(--gray-l)] border border-[var(--border)] rounded-3xl p-20 text-center shadow-sm">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-[var(--black)] mb-2">Nenhum campeonato com inscrições abertas</h3>
            <p className="text-[var(--gray)] text-sm max-w-md mx-auto">
              No momento não há campeonatos disponíveis. A Federação avisará quando houver novas inscrições.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {championships.map((championship: any) => {
              const isRegistered = championship.registrations && championship.registrations.length > 0
              
              return (
                <div key={championship.id} className="fgb-card bg-white border border-[var(--border)] rounded-3xl overflow-hidden hover:border-orange-300 transition-all duration-300 group relative shadow-sm">
                  {isRegistered && (
                    <div className="absolute top-0 right-0 bg-[var(--verde)] text-white px-6 py-2 rounded-bl-3xl font-black italic uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" />
                      Inscrito
                    </div>
                  )}
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 border border-orange-200 uppercase tracking-widest">
                            Inscrições Abertas
                          </span>
                          <span className="text-[var(--gray)] text-xs font-bold uppercase tracking-widest">
                            {championship.sex === 'masculino' ? '♂ Masculino' : championship.sex === 'feminino' ? '♀ Feminino' : '⚡ Misto'}
                          </span>
                        </div>
                        <h2 className="text-2xl font-display font-black text-[var(--black)] mb-2 group-hover:text-orange-600 transition-colors uppercase italic">
                          {championship.name}
                        </h2>
                        {championship.description && (
                          <p className="text-[var(--gray)] text-sm mb-4 line-clamp-2">{championship.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-xs font-bold text-[var(--gray)] mb-6">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-[var(--verde)]" />
                            Mín. {championship.minTeamsPerCat} equipes/categoria
                          </span>
                          <span className="flex items-center gap-1.5 text-orange-600">
                            <Calendar className="w-3 h-3" />
                            Prazo: {new Date(championship.regDeadline).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Trophy className="w-3 h-3 text-[var(--amarelo)]" />
                            {championship._count.registrations} inscrição(ões)
                          </span>
                        </div>

                        {championship.categories.length > 0 && (
                          <div>
                            <p className="fgb-label text-[10px] font-black text-[var(--gray)] uppercase tracking-widest mb-3">Categorias disponíveis</p>
                            <div className="flex flex-wrap gap-2">
                              {championship.categories.map((cat: any) => (
                                <div key={cat.id} className="bg-[var(--gray-l)] border border-[var(--border)] rounded-xl px-3 py-2 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-inner">
                                  <p className="text-xs font-bold text-[var(--black)]">{cat.name}</p>
                                  <p className="text-[10px] text-[var(--gray)] mt-0.5">{cat._count.registrations} equipe(s)</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="md:ml-8 shrink-0 flex flex-col justify-center">
                        {isRegistered ? (
                          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                              <CheckCircle2 className="w-5 h-5 text-green-700" />
                            </div>
                            <p className="text-sm font-bold text-green-800 uppercase italic tracking-tight">Equipe Inscrita</p>
                            <p className="text-[10px] text-green-600/80 mt-1">Aguardando validação</p>
                          </div>
                        ) : (
                          <Link
                            href={`/team/championships/${championship.id}/register`}
                            className="inline-flex items-center justify-center bg-[var(--amarelo)] hover:bg-[var(--orange-dark)] text-[var(--black)] font-black italic uppercase tracking-tighter h-14 px-10 rounded-2xl text-lg transition-all shadow-sm hover:scale-105 active:scale-95"
                          >
                            Inscrever agora
                            <ChevronRight className="ml-2 w-5 h-5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto font-sans px-4 sm:px-6">
        <div className="animate-fade-in border-b border-[var(--border)] pb-8">
          <h1 className="text-4xl font-display font-black text-[var(--black)] tracking-tight uppercase italic">Campeonatos</h1>
        </div>
        <div className="fgb-card bg-[var(--gray-l)] border border-[var(--border)] rounded-3xl p-20 text-center shadow-sm">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-[var(--black)] mb-2">Ops! Algo deu errado</h3>
          <p className="text-[var(--gray)] text-sm max-w-md mx-auto">Não conseguimos carregar os campeonatos no momento.</p>
        </div>
      </div>
    )
  }
}
