import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Sparkles, Users, Calendar, ArrowRight, ShieldCheck, AlertTriangle, Wand2 } from 'lucide-react'
import { AISchedulingModal } from '@/components/AISchedulingModal'

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      minTeamsPerCat: true,
      hasPlayoffs: true,
      startDate: true,
      endDate: true
    }
  })

  const categoriesWithTeams = await prisma.championshipCategory.findMany({
    where: { championshipId: id },
    include: {
      _count: {
        select: {
          registrations: {
            where: { registration: { status: 'CONFIRMED' } }
          }
        }
      },
      games: {
        where: { phase: 1 },
        take: 1,
        select: { id: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  if (!championship) return <div>Campeonato nao encontrado</div>

  const minTeams = championship.minTeamsPerCat || 3

  const categoriesReady = categoriesWithTeams.filter(
    cat => cat._count.registrations >= minTeams
  )
  const hasAnyReady = categoriesReady.length > 0
  
  const categoriesMissing = categoriesWithTeams.filter(cat => cat._count.registrations < minTeams)

  return (
    <div className="space-y-8 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-[var(--gray-l)] p-8 rounded-[32px] border border-[var(--border)]">
        <div>
          <h2 className="fgb-display text-4xl text-[var(--black)] leading-none">
            Organizacao
          </h2>
          <p className="fgb-label text-[var(--gray)] mt-2" style={{ fontSize: 10, letterSpacing: 2 }}>
            Logistica, calendario e viabilidade por categoria
          </p>
        </div>
      </div>

      {/* Alerta de Viabilidade */}
      {!hasAnyReady && (
        <div className="bg-orange-50 border border-orange-200 rounded-[28px] p-8 flex flex-col md:flex-row items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0 border border-orange-300">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-2">
              Acao requerida: categorias incompletas
            </p>
            <p className="text-sm text-[var(--gray)] font-medium leading-relaxed">
              Nenhuma categoria atingiu o minimo de {minTeams} equipes confirmadas. A organizacao so sera possivel quando ao menos uma categoria estiver pronta.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
               {categoriesMissing.map(cat => (
                 <span key={cat.id} className="text-[9px] font-black uppercase px-3 py-1 bg-white border border-[var(--border)] rounded-lg text-orange-600 shadow-sm">
                    {cat.name}: falta {minTeams - cat._count.registrations}
                 </span>
               ))}
            </div>
          </div>
          <Link
            href={`/admin/championships/${id}/registrations`}
            className="px-6 h-11 bg-white border border-[var(--border)] hover:bg-[var(--amarelo)] hover:border-[#E66000] text-[var(--black)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            Gerenciar inscricoes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {hasAnyReady && categoriesMissing.length > 0 && (
        <div className="bg-white border border-[var(--border)] rounded-[24px] p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--gray-l)] flex items-center justify-center flex-shrink-0 border border-[var(--border)]">
            <Sparkles className="w-5 h-5 text-[var(--gray)]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)] mb-2">
              Organizacao parcial liberada
            </p>
            <p className="text-sm text-[var(--gray)] font-medium leading-relaxed">
              A IA vai organizar apenas as categorias que ja atingiram o minimo. As demais permanecem pendentes.
            </p>
          </div>
          <Link
            href={`/admin/championships/${id}/registrations`}
            className="px-5 h-10 bg-[var(--gray-l)] border border-[var(--border)] text-[var(--black)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
          >
            Ver pendencias <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {hasAnyReady && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gray)]">Planejamento com IA</p>
              <h3 className="fgb-display text-2xl text-[var(--black)] mt-2">Organizacao automatica</h3>
              <p className="text-sm text-[var(--gray)] mt-1">
                A IA monta o calendario completo dentro das regras e janelas configuradas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="fgb-badge fgb-badge-verde">IA</span>
              <span className="fgb-badge fgb-badge-outline">Planejamento</span>
            </div>
          </div>

          <AISchedulingModal
            championshipId={id}
            championshipName={championship.name}
            onClose={() => {}}
            onApplied={() => {}}
            variant="page"
          />

          <div className="fgb-card bg-white p-6 border border-[var(--border)] rounded-[28px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gray)]">Gestao e otimizacao</p>
                <h4 className="text-lg font-black text-[var(--black)] mt-2">Ajustes finos apos planejamento</h4>
                <p className="text-sm text-[var(--gray)] mt-1">
                  Depois de aplicar o calendario, use a IA para otimizar datas ou ajuste manualmente.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">
                  <Wand2 className="h-3.5 w-3.5" />
                  Otimizar com IA
                </button>
                <Link
                  href={`/admin/championships/${id}/matches`}
                  className="flex items-center gap-2 rounded-xl bg-[var(--amarelo)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]"
                >
                  Ajustar manualmente
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesWithTeams.map(cat => {
          const count = cat._count.registrations
          const ready = count >= minTeams
          const hasGames = cat.games.length > 0
          const pct = Math.min(100, Math.round((count / minTeams) * 100))

          return (
            <div
              key={cat.id}
              className={`fgb-card bg-white p-8 transition-all group ${
                ready ? 'border-green-200 hover:border-green-400 shadow-sm' : 'hover:border-orange-200'
              }`}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                  <p className="fgb-display text-xl text-[var(--black)] leading-none group-hover:text-green-600 transition-colors">
                    {cat.name}
                  </p>
                  <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10, letterSpacing: 2 }}>Categoria Oficial</p>
                </div>
                {hasGames ? (
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center border border-green-200">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                ) : ready ? (
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-200">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[var(--gray-l)] flex items-center justify-center border border-[var(--border)]">
                    <Users className="w-5 h-5 text-[var(--gray)]" />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-[var(--gray)] uppercase tracking-widest">
                        Equipes Confirmadas
                      </span>
                      <span className={`text-lg font-black ${ready ? 'text-green-600' : 'text-orange-600'}`}>
                        {count} <span className="text-slate-400 text-xs">/ {minTeams}</span>
                      </span>
                   </div>
                   <div className="h-2 bg-[var(--gray-l)] rounded-full overflow-hidden border border-[var(--border)]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${ready ? 'bg-[var(--verde)] shadow-sm' : 'bg-[var(--amarelo)]'}`}
                        style={{ width: `${pct}%` }}
                      />
                   </div>
                </div>

                <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-[var(--gray)] uppercase tracking-widest">Estado</span>
                      <span className={`text-[10px] font-black uppercase mt-1 ${
                        hasGames ? 'text-green-600' : ready ? 'text-orange-600' : 'text-[var(--gray)]'
                      }`}>
                         {hasGames ? '✓ Organizado' : ready ? 'Ready to IA' : 'Aguardando'}
                      </span>
                   </div>
                   {hasGames && (
                      <Link
                        href={`/admin/championships/${id}/matches`}
                        className="text-[9px] font-black uppercase tracking-widest text-[var(--black)] hover:bg-[var(--amarelo)] hover:border-[#E66000] border border-[var(--border)] flex items-center gap-1.5 bg-[var(--gray-l)] px-4 h-8 rounded-lg transition-all shadow-sm"
                      >
                         Jogos <Calendar className="w-3 h-3 text-[var(--black)]" />
                      </Link>
                   )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
