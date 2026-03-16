import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Trophy, Calendar, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeamChampionshipsPage() {
  try {
    const championships = await prisma.championship.findMany({
      where: { status: 'REGISTRATION_OPEN' },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: {
          include: { _count: { select: { registrations: true } } }
        },
        _count: { select: { registrations: true } }
      }
    })

    return (
      <div className="space-y-10 max-w-5xl mx-auto">
        <div className="animate-fade-in border-b border-white/[0.05] pb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#FF6B00]" />
            </div>
            <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Inscrições Disponíveis</span>
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight">Campeonatos</h1>
          <p className="text-slate-400 mt-2 font-medium">Campeonatos com inscrições abertas para sua equipe.</p>
        </div>

        {championships.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
            <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum campeonato com inscrições abertas</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              No momento não há campeonatos disponíveis. A Federação avisará quando houver novas inscrições.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {championships.map((championship) => (
              <div key={championship.id} className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden hover:border-[#FF6B00]/30 transition-all duration-300 group">
                <div className="p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center rounded-full bg-[#FF6B00]/10 px-3 py-1 text-xs font-bold text-[#FF6B00] border border-[#FF6B00]/20 uppercase tracking-widest">
                          Inscrições Abertas
                        </span>
                        <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                          {championship.sex === 'masculino' ? '♂ Masculino' : championship.sex === 'feminino' ? '♀ Feminino' : '⚡ Misto'}
                        </span>
                      </div>
                      <h2 className="text-2xl font-display font-black text-white mb-2 group-hover:text-[#FF6B00] transition-colors">
                        {championship.name}
                      </h2>
                      {championship.description && (
                        <p className="text-slate-400 text-sm mb-4">{championship.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 mb-6">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          Mín. {championship.minTeamsPerCat} equipes/categoria
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          Prazo: {new Date(championship.regDeadline).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Trophy className="w-3 h-3" />
                          {championship._count.registrations} inscrição(ões)
                        </span>
                      </div>

                      {championship.categories.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Categorias disponíveis</p>
                          <div className="flex flex-wrap gap-2">
                            {championship.categories.map((cat) => (
                              <div key={cat.id} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                                <p className="text-xs font-bold text-white">{cat.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{cat._count.registrations} equipe(s)</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:ml-8 shrink-0">
                      <Link
                        href={`/team/championships/${championship.id}/register`}
                        className="inline-flex items-center justify-center bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold h-12 px-8 rounded-xl text-sm transition-all shadow-[0_4px_15px_rgba(255,107,0,0.2)] hover:shadow-[0_4px_25px_rgba(255,107,0,0.4)]"
                      >
                        Realizar Inscrição →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto">
        <div className="animate-fade-in border-b border-white/[0.05] pb-8">
          <h1 className="text-4xl font-display font-black text-white tracking-tight">Campeonatos</h1>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
          <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum campeonato disponível no momento</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">A Federação irá anunciar quando as inscrições abrirem.</p>
        </div>
      </div>
    )
  }
}
