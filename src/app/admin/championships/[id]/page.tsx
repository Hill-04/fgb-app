import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'
import { Users, Calendar, BarChart3, CheckCircle2, PlayCircle, Sparkles, Settings } from 'lucide-react'
import { Brackets } from '@/components/Brackets'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatChampionshipStatus } from '@/lib/utils'
import { DashboardErrorActions } from '@/components/DashboardErrorActions'

export const dynamic = 'force-dynamic'

export default async function ChampionshipDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const championship = await prisma.championship.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            _count: { select: { games: true } }
          }
        },
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMED' } },
            games: true
          }
        }
      }
    })

    if (!championship) return <div>Campeonato não encontrado</div>

    const confirmedTeams = championship._count.registrations
    const totalGames = championship._count.games
    const completedGames = await prisma.game.count({
      where: { championshipId: id, status: 'FINISHED' }
    })

    const registrationCount = await prisma.registration.count({
      where: { championshipId: id, status: 'CONFIRMED' }
    })
    const categoryCount = championship.categories.length
    const minTeams = championship.minTeamsPerCat || 3
    const firstCategory = championship.categories[0]
    const activeChampionshipId = id

    // Métricas para o Pipeline
    const categoriesWithTeams = await prisma.championshipCategory.findMany({
      where: { championshipId: id },
      include: {
        _count: {
          select: {
            registrations: {
              where: { registration: { status: 'CONFIRMED' } }
            }
          }
        }
      }
    })

    const missingPerCategory = categoriesWithTeams.map(cat => ({
      name: cat.name,
      confirmed: cat._count.registrations,
      missing: Math.max(0, minTeams - cat._count.registrations)
    }))
    const totalMissing = missingPerCategory.reduce((acc, c) => acc + c.missing, 0)
    const allCategoriesReady = totalMissing === 0

    const topStandings = firstCategory ? await prisma.standing.findMany({
      where: { categoryId: firstCategory.id },
      orderBy: [{ points: 'desc' }, { wins: 'desc' }],
      take: 5,
      include: { team: true }
    }) : []

    const nextGame = await prisma.game.findFirst({
      where: { championshipId: id, status: 'SCHEDULED', dateTime: { gt: new Date() } },
      orderBy: { dateTime: 'asc' },
      include: { homeTeam: true, awayTeam: true, category: true }
    })

    const lastResults = await prisma.game.findMany({
      where: { championshipId: id, status: 'FINISHED' },
      orderBy: { dateTime: 'desc' },
      take: 5,
      include: { homeTeam: true, awayTeam: true, category: true }
    })

    const upcomingGames = await prisma.game.findMany({
      where: { championshipId: id, status: 'SCHEDULED' },
      orderBy: { dateTime: 'asc' },
      take: 5,
      include: { homeTeam: true, awayTeam: true, category: true }
    })

    const playoffCategory = championship.hasPlayoffs ? await prisma.championshipCategory.findFirst({
      where: { championshipId: id, games: { some: { phase: { gt: 1 } } } },
      include: {
        games: {
          where: { phase: { gt: 1 } },
          include: {
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } }
          },
          orderBy: { dateTime: 'asc' }
        }
      }
    }) : null

    const statusMap = {
      'DRAFT': 1,
      'REGISTRATION_OPEN': 2,
      'REGISTRATION_CLOSED': 3,
      'ONGOING': 4,
      'FINISHED': 5
    }
    const currentStep = statusMap[championship.status as keyof typeof statusMap] || 1

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 pb-10">

        {/* ─── COLUNA ESQUERDA — Pipeline Vertical ─── */}
        <div className="lg:sticky lg:top-6 h-fit fgb-card p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9, letterSpacing: 2 }}>
              Pipeline de Execução
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/championships/${id}/settings`}
                className="w-7 h-7 rounded-lg bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center text-[var(--gray)] hover:text-[var(--black)] hover:border-[var(--black)] transition-all shadow-sm"
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <span className={`text-[9px] font-black font-sans uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${
                championship.status === 'ONGOING' ? 'text-green-600 bg-green-50 border-green-200' :
                championship.status === 'REGISTRATION_OPEN' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                championship.status === 'FINISHED' ? 'text-[var(--verde)] bg-[var(--verde)]/10 border-[var(--verde)]/20' :
                'text-[var(--gray)] bg-[var(--gray-l)] border-[var(--border)]'
              }`}>
                {formatChampionshipStatus(championship.status)}
              </span>
            </div>
          </div>

          <div className="space-y-0">

            {/* ── STEP 1: CRIAÇÃO ── */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 border border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="w-px flex-1 bg-[var(--border)] my-2 min-h-[24px]" />
              </div>
              <div className="pb-5 flex-1 min-w-0 font-sans">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-black uppercase text-[var(--black)] tracking-tight">Criação</p>
                  <span className="text-[8px] font-black uppercase text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Concluído</span>
                </div>
                <p className="text-[10px] text-[var(--gray)]">Campeonato configurado e categorias definidas</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {championship.categories?.slice(0, 4).map((cat: any) => (
                    <span key={cat.id} className="text-[8px] font-black uppercase bg-[var(--gray-l)] border border-[var(--border)] px-2 py-0.5 rounded-lg text-[var(--gray)]">
                      {cat.name}
                    </span>
                  ))}
                  {championship.categories?.length > 4 && (
                    <span className="text-[8px] font-black uppercase bg-[var(--gray-l)] border border-[var(--border)] px-2 py-0.5 rounded-lg text-[var(--gray)]">
                      +{championship.categories.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── STEP 2: INSCRIÇÕES ── */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black shadow-sm ${
                  currentStep > 2 ? 'bg-green-50 border border-green-200' :
                  currentStep === 2 ? 'bg-[var(--amarelo)] text-[var(--black)]' :
                  'bg-white border border-[var(--border)]'
                }`}>
                  {currentStep > 2
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <span className={currentStep === 2 ? 'text-[var(--black)]' : 'text-[var(--gray)]'}>2</span>
                  }
                </div>
                <div className="w-px flex-1 bg-[var(--border)] my-2 min-h-[24px]" />
              </div>
              <div className="pb-5 flex-1 min-w-0 font-sans">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs font-black uppercase tracking-tight ${currentStep >= 2 ? 'text-[var(--black)]' : 'text-[var(--gray)]'}`}>
                    Inscrições
                  </p>
                  {currentStep === 2 && (
                    <span className="text-[8px] font-black uppercase text-[var(--black)] bg-[var(--amarelo)] px-1.5 py-0.5 rounded-full">Ativo</span>
                  )}
                  {currentStep > 2 && (
                    <span className="text-[8px] font-black uppercase text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Concluído</span>
                  )}
                </div>

                {currentStep === 2 && !allCategoriesReady && (
                  <div className="flex items-center gap-1.5 mt-1 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--amarelo)] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-600">
                      Inscrições em andamento
                    </span>
                  </div>
                )}
                {currentStep === 2 && allCategoriesReady && (
                  <div className="flex items-center gap-1.5 mt-1 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--verde)]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--verde)]">
                      Pronto para organizar
                    </span>
                  </div>
                )}

                {championship.regDeadline && (
                  <p className="text-[10px] text-[var(--gray)] mb-2">
                    Prazo: {new Date(championship.regDeadline).toLocaleDateString('pt-BR')}
                    {new Date(championship.regDeadline) < new Date() ? ' (encerrado)' : ''}
                  </p>
                )}

                {currentStep === 2 && (
                  <div className="bg-[var(--gray-l)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
                    {/* Checklist */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center ${championship.regDeadline ? 'bg-green-100' : 'bg-[var(--border)]'}`}>
                          {championship.regDeadline && <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${championship.regDeadline ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                          Prazo de inscrições definido
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center ${allCategoriesReady ? 'bg-green-100' : 'bg-[var(--border)]'}`}>
                          {allCategoriesReady && <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${allCategoriesReady ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                          Mínimo de {minTeams} times por categoria
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border)]" />

                    {/* Progresso por categoria */}
                    <div className="space-y-2.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                        Progresso por categoria
                      </p>
                      {missingPerCategory.map((cat, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[var(--gray)] truncate max-w-[160px]">{cat.name}</span>
                            <span className={`text-[10px] font-black flex-shrink-0 ml-2 ${cat.missing === 0 ? 'text-[var(--verde)]' : 'text-orange-600'}`}>
                              {cat.confirmed}/{minTeams}
                              {cat.missing > 0 && ` (falta ${cat.missing})`}
                            </span>
                          </div>
                          <div className="h-1.5 bg-white border border-[var(--border)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${cat.missing === 0 ? 'bg-[var(--verde)]' : 'bg-[var(--amarelo)]'}`}
                              style={{ width: `${Math.min(100, Math.round((cat.confirmed / minTeams) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[var(--border)]" />

                    <div className="flex items-center justify-between">
                      <div>
                        {totalMissing > 0 ? (
                          <p className="text-[10px] text-orange-600 font-black">Faltam {totalMissing} equipe(s)</p>
                        ) : (
                          <p className="text-[10px] text-[var(--verde)] font-black">✓ Todas as categorias completas</p>
                        )}
                        <p className="text-[9px] text-[var(--gray)] mt-0.5">{confirmedTeams} equipe(s) inscrita(s)</p>
                      </div>
                      <Link
                        href={`/admin/championships/${activeChampionshipId}/registrations`}
                        className="text-[9px] font-black uppercase tracking-widest text-[var(--black)] bg-white border border-[var(--border)] px-3 py-1.5 rounded-lg hover:bg-[var(--amarelo)] hover:border-[var(--amarelo)] transition-all flex-shrink-0 shadow-sm"
                      >
                        Gerenciar →
                      </Link>
                    </div>
                  </div>
                )}

                {currentStep > 2 && (
                  <p className="text-[10px] text-[var(--gray)]">{confirmedTeams} equipes confirmadas</p>
                )}
              </div>
            </div>

            {/* ── STEP 3: ORGANIZAÇÃO ── */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black shadow-sm ${
                  currentStep > 3 ? 'bg-green-50 border border-green-200' :
                  currentStep === 3 ? 'bg-[var(--amarelo)] text-[var(--black)]' :
                  allCategoriesReady && currentStep === 2 ? 'bg-[var(--amarelo)]/30 border border-[var(--amarelo)]/50' :
                  'bg-white border border-[var(--border)]'
                }`}>
                  {currentStep > 3
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <span className={
                        currentStep === 3 ? 'text-[var(--black)]' :
                        allCategoriesReady ? 'text-orange-600' :
                        'text-[var(--gray)]'
                      }>3</span>
                  }
                </div>
                <div className="w-px flex-1 bg-[var(--border)] my-2 min-h-[24px]" />
              </div>
              <div className="pb-5 flex-1 min-w-0 font-sans">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs font-black uppercase tracking-tight ${
                    currentStep >= 3 || allCategoriesReady ? 'text-[var(--black)]' : 'text-[var(--gray)]'
                  }`}>
                    Organização
                  </p>
                  {currentStep === 3 && (
                    <span className="text-[8px] font-black uppercase text-[var(--black)] bg-[var(--amarelo)] px-1.5 py-0.5 rounded-full">Ativo</span>
                  )}
                  {currentStep > 3 && (
                    <span className="text-[8px] font-black uppercase text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Concluído</span>
                  )}
                </div>

                {(currentStep === 3 || allCategoriesReady) && currentStep < 4 && (
                  <div className="flex items-center gap-1.5 mt-1 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--amarelo)] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-600">
                      Organização disponível
                    </span>
                  </div>
                )}

                {(currentStep === 3 || (allCategoriesReady && currentStep === 2)) && (
                  <div className="bg-[var(--gray-l)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] text-[var(--gray)]">
                      Gere o calendário completo de jogos, confrontos e datas usando a IA.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-[var(--border)]">
                        <p className="text-[8px] font-black uppercase text-[var(--gray)] mb-1">Categorias</p>
                        <p className="text-sm font-black text-[var(--black)]">{categoryCount}</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-[var(--border)]">
                        <p className="text-[8px] font-black uppercase text-[var(--gray)] mb-1">Equipes</p>
                        <p className="text-sm font-black text-[var(--black)]">{confirmedTeams}</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-[var(--border)]">
                        <p className="text-[8px] font-black uppercase text-[var(--gray)] mb-1">Mín./Cat.</p>
                        <p className="text-sm font-black text-[var(--black)]">{minTeams}</p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/championships/${activeChampionshipId}/organization`}
                      className="flex items-center justify-center gap-2 w-full text-[10px] font-black uppercase tracking-widest text-[var(--black)] bg-[var(--amarelo)] hover:bg-[#E66000] h-10 rounded-xl transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Organizar com IA
                    </Link>
                  </div>
                )}

                {currentStep > 3 && (
                  <p className="text-[10px] text-[var(--gray)]">Calendário gerado e aplicado</p>
                )}
                {currentStep < 3 && !allCategoriesReady && (
                  <p className="text-[10px] text-[var(--gray)]">Aguardando inscrições completas</p>
                )}
              </div>
            </div>

            {/* ── STEP 4: EM ANDAMENTO ── */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black shadow-sm ${
                  currentStep > 4 ? 'bg-green-50 border border-green-200' :
                  currentStep === 4 ? 'bg-[var(--amarelo)] text-[var(--black)]' :
                  'bg-white border border-[var(--border)]'
                }`}>
                  {currentStep > 4
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <span className={currentStep === 4 ? 'text-[var(--black)]' : 'text-[var(--gray)]'}>4</span>
                  }
                </div>
                <div className="w-px flex-1 bg-[var(--border)] my-2 min-h-[24px]" />
              </div>
              <div className="pb-5 flex-1 min-w-0 font-sans">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs font-black uppercase tracking-tight ${currentStep >= 4 ? 'text-[var(--black)]' : 'text-[var(--gray)]'}`}>
                    Em Andamento
                  </p>
                  {currentStep === 4 && (
                    <span className="text-[8px] font-black uppercase text-[var(--black)] bg-[var(--amarelo)] px-1.5 py-0.5 rounded-full">Ativo</span>
                  )}
                </div>

                {currentStep === 4 && (
                  <div className="flex items-center gap-1.5 mt-1 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--amarelo)] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-600">
                      Em andamento
                    </span>
                  </div>
                )}

                <p className="text-[10px] text-[var(--gray)] mb-2">
                  Registre resultados e acompanhe a classificação em tempo real
                </p>

                {currentStep === 4 && (
                  <div className="bg-[var(--gray-l)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-[var(--border)]">
                        <p className="text-[8px] font-black uppercase text-[var(--gray)] mb-1">Realizados</p>
                        <p className="text-lg font-black text-[var(--black)]">{completedGames}</p>
                      </div>
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-[var(--border)]">
                        <p className="text-[8px] font-black uppercase text-[var(--gray)] mb-1">Pendentes</p>
                        <p className="text-lg font-black text-orange-600">{totalGames - completedGames}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[9px] text-[var(--gray)]">Progresso geral</span>
                        <span className="text-[9px] font-black text-[var(--black)]">
                          {totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white border border-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--amarelo)] rounded-full transition-all"
                          style={{ width: `${totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/championships/${activeChampionshipId}/matches`}
                        className="flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-[var(--black)] bg-[var(--amarelo)] hover:bg-[#E66000] h-9 rounded-xl transition-all shadow-sm"
                      >
                        Registrar resultado
                      </Link>
                      <Link
                        href={`/admin/championships/${activeChampionshipId}/standings`}
                        className="flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)] bg-white border border-[var(--border)] hover:border-gray-300 h-9 rounded-xl transition-all shadow-sm"
                      >
                        Classificação
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── STEP 5: ENCERRAMENTO ── */}
            <div className="flex gap-4">
              <div className="flex items-start">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black shadow-sm ${
                  currentStep === 5 ? 'bg-green-50 border border-green-200' : 'bg-white border border-[var(--border)]'
                }`}>
                  {currentStep === 5
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <span className="text-[var(--gray)]">5</span>
                  }
                </div>
              </div>
              <div className="flex-1 min-w-0 pl-4 font-sans">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs font-black uppercase tracking-tight ${currentStep === 5 ? 'text-green-600' : 'text-[var(--gray)]'}`}>
                    Encerramento
                  </p>
                  {currentStep === 5 && (
                    <span className="text-[8px] font-black uppercase text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Finalizado</span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--gray)]">
                  {currentStep === 5
                    ? 'Campeonato encerrado com sucesso'
                    : `Disponível quando todos os ${totalGames} jogos forem realizados`
                  }
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ─── COLUNA DIREITA — Stats + Jogos + Resultados ─── */}
        <div className="space-y-6">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Categorias" value={categoryCount} sublabel="categorias ativas" accent="blue" icon={<BarChart3 className="w-5 h-5" />} />
            <StatCard label="Equipes Inscritas" value={confirmedTeams} sublabel="Times confirmados" accent="blue" icon={<Users className="w-5 h-5" />} />
            <StatCard label="Progresso de Jogos" value={`${completedGames}/${totalGames}`} sublabel="Jogos realizados" accent="purple" icon={<Calendar className="w-5 h-5" />} />
            <StatCard
              label="Próximo Jogo"
              value={nextGame ? format(nextGame.dateTime, "dd MMM", { locale: ptBR }) : "--"}
              sublabel={nextGame ? `${nextGame.homeTeam.name} vs ${nextGame.awayTeam.name}` : "Nenhum jogo agendado"}
              accent="green"
              icon={<PlayCircle className="w-5 h-5" />}
            />
          </div>

          {/* Próximos Jogos + Últimos Resultados */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="fgb-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--gray-l)]">
                <h3 className="fgb-label text-[var(--black)] uppercase" style={{ fontSize: 10 }}>Próximos Jogos</h3>
                <Link href={`/admin/championships/${id}/matches`} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Ver Todos →</Link>
              </div>
              <div className="divide-y divide-[var(--border)] bg-white font-sans">
                {upcomingGames.length > 0 ? upcomingGames.map((game) => (
                  <div key={game.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-[var(--gray-l)] transition-all">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-[var(--black)] truncate">{game.homeTeam.name} <span className="opacity-40 font-medium px-1">vs</span> {game.awayTeam.name}</span>
                      <span className="text-[9px] font-bold text-[var(--gray)] mt-0.5">{format(game.dateTime, "dd MMM • HH:mm", { locale: ptBR })}</span>
                    </div>
                    <Badge variant="purple" size="sm" className="ml-3 flex-shrink-0">{game.category.name}</Badge>
                  </div>
                )) : (
                  <div className="p-10 text-center text-xs text-[var(--gray)] italic">Nenhum jogo agendado.</div>
                )}
              </div>
            </div>

            <div className="fgb-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--gray-l)]">
                <h3 className="fgb-label text-[var(--black)] uppercase" style={{ fontSize: 10 }}>Últimos Resultados</h3>
                <Link href={`/admin/championships/${id}/matches`} className="text-[10px] font-black text-[var(--verde)] uppercase hover:underline">Histórico →</Link>
              </div>
              <div className="divide-y divide-[var(--border)] bg-white font-sans">
                {lastResults.length > 0 ? lastResults.map((game) => (
                  <div key={game.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-[var(--gray-l)] transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-[var(--gray)] truncate max-w-[90px]">{game.homeTeam.name}</span>
                      <span className="text-base font-black text-[var(--black)] tabular-nums flex-shrink-0 bg-[var(--gray-l)] px-2 py-0.5 rounded-md border border-[var(--border)]">{game.homeScore} - {game.awayScore}</span>
                      <span className="text-xs font-bold text-[var(--gray)] truncate max-w-[90px]">{game.awayTeam.name}</span>
                    </div>
                    <Badge variant="success" size="sm" className="flex-shrink-0">FIM</Badge>
                  </div>
                )) : (
                  <div className="p-10 text-center text-xs text-[var(--gray)] italic">Sem resultados recentes.</div>
                )}
              </div>
            </div>
          </div>

          {/* Classificação rápida + Bracket */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <div className="xl:col-span-3 fgb-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--gray-l)]">
                <h3 className="fgb-label text-[var(--black)] uppercase" style={{ fontSize: 10 }}>
                  Classificação — <span className="opacity-50">{firstCategory?.name || "Geral"}</span>
                </h3>
                <Link href={`/admin/championships/${id}/standings`} className="text-[10px] font-black text-[var(--verde)] uppercase hover:underline">Ver Completa →</Link>
              </div>
              <div className="divide-y divide-[var(--border)] bg-white font-sans">
                {topStandings.length > 0 ? topStandings.map((standing, idx) => (
                  <div key={standing.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-[var(--gray-l)] group transition-all">
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-black w-6 text-center ${idx === 0 ? 'text-[var(--amarelo)] drop-shadow-sm' : idx === 1 ? 'text-slate-400' : 'text-orange-800 opacity-60'}`}>{idx + 1}°</span>
                      <span className="text-sm font-bold text-[var(--black)] group-hover:text-[var(--verde)] transition-colors">{standing.team.name}</span>
                    </div>
                    <div className="flex items-center gap-6 pr-2">
                      <div className="text-center">
                        <p className="text-[8px] font-black text-[var(--gray)] uppercase mb-0.5">PTS</p>
                        <p className="text-sm font-black text-[var(--black)] leading-none">{standing.points}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-[var(--gray)] uppercase mb-0.5">V</p>
                        <p className="text-sm font-black text-green-600 leading-none">{standing.wins}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-[var(--gray)] uppercase mb-0.5">D</p>
                        <p className="text-sm font-black text-red-500 leading-none">{standing.losses}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center text-xs text-[var(--gray)] italic">Aguardando início dos jogos.</div>
                )}
              </div>
            </div>

            <div className="xl:col-span-2 fgb-card p-6 bg-white">
              <div className="flex justify-between items-center mb-5">
                <h3 className="fgb-label text-[var(--black)] uppercase" style={{ fontSize: 10 }}>Bracket Preview</h3>
                <Badge variant="purple" size="sm">Playoffs</Badge>
              </div>
              {playoffCategory ? (
                <div className="transform scale-90 origin-top bg-[var(--gray-l)] rounded-xl border border-[var(--border)] p-4 overflow-hidden">
                  <Brackets games={playoffCategory.games as any} />
                </div>
              ) : (
                <div className="h-36 border border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-[var(--gray-l)]">
                  <BarChart3 className="w-7 h-7 text-slate-300 mb-3" />
                  <p className="fgb-label text-[var(--gray)] uppercase tracking-widest text-center mx-auto max-w-[150px] leading-relaxed" style={{ fontSize: 8 }}>Etapa indisponível em fase regular</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    )
  } catch (error: any) {
    console.error("Dashboard Error:", error)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 pb-10">
        <div className="lg:sticky lg:top-6 h-fit fgb-card border-red-200 p-6">
          <div className="space-y-4">
            <h2 className="fgb-display text-xl text-[var(--black)] leading-none">Status do Painel</h2>
            <p className="font-sans text-[10px] items-center justify-center font-bold text-[var(--red)] uppercase tracking-widest bg-red-50 p-4 border border-red-100 rounded-xl">
              Erro Crítico: {error.message}
            </p>
            <DashboardErrorActions championshipId={id} />
          </div>
        </div>

        <div className="fgb-card border-red-200 bg-red-50 p-20 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="fgb-display text-4xl text-[var(--red)] leading-none mb-4">Erro ao carregar Dashboard</h2>
            <p className="fgb-label text-[var(--gray)] mb-8 max-w-md mx-auto text-sm leading-relaxed" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Detectamos uma inconsistência no banco de dados. Isso geralmente acontece após atualizações no sistema. Use o botão ao lado para tentar a auto-correção.
            </p>
          </div>
        </div>
      </div>
    )
  }
}
