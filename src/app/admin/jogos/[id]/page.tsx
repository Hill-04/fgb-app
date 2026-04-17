"use client"

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  BarChart3, 
  Settings, 
  AlertTriangle, 
  Shield, 
  CheckCircle2,
  Lock,
  Trophy,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/Badge'
import { checkGameConsistency, type ConsistencyResult } from '@/lib/games-consistency'
import type { GameWithTeams, GameStat } from '@/types/database'

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [game, setGame] = useState<GameWithTeams | null>(null)
  const [stats, setStats] = useState<GameStat[]>([])
  const [loading, setLoading] = useState(true)
  const [eligibleCounts, setEligibleCounts] = useState({ home: 0, away: 0 })
  const [rosters, setRosters] = useState<any[]>([])
  const [finalizing, setFinalizing] = useState(false)
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false)
  const [ignoreDiscrepancy, setIgnoreDiscrepancy] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/jogos/${id}/stats`)
      if (res.ok) {
        const data = await res.json()
        setGame(data.game)
        setStats(data.stats)
        setRosters(data.rosters || [])
        const homeEligible = data.athletes.filter((a: any) => a.team_id === data.game.home_team_id).length
        const awayEligible = data.athletes.filter((a: any) => a.team_id === data.game.away_team_id).length
        setEligibleCounts({ home: homeEligible, away: awayEligible })
      }
    } catch (err) {
      console.error('Erro ao buscar dados do jogo:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleFinalize = async () => {
    try {
      setFinalizing(true)
      const res = await fetch(`/api/admin/jogos/${id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ignoreDiscrepancy })
      })

      if (res.ok) {
        setFinalizeModalOpen(false)
        fetchData() // Recarregar estado
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao finalizar jogo')
      }
    } catch (err) {
      console.error('Erro ao finalizar:', err)
    } finally {
      setFinalizing(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse fgb-label text-[var(--gray)]">Carregando detalhes do jogo...</div>
    </div>
  )

  if (!game) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-[var(--black)]">Jogo não encontrado</h2>
      <Button onClick={() => router.back()} variant="ghost" className="mt-4">Voltar</Button>
    </div>
  )

  const consistency = checkGameConsistency(game, stats)

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20 relative">
      {/* Header / Nav */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/admin/jogos')}
          className="text-[var(--gray)] hover:text-[var(--black)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Jogos
        </Button>
        <div className="flex gap-3">
          <Link href={`/admin/jogos/${id}/roster`}>
            <Button variant="outline" className="border-[var(--border)] bg-white h-12 px-8 font-bold">
              <Users className="w-4 h-4 mr-2" />
              Gerenciar Roster
            </Button>
          </Link>

          <Link href={`/admin/jogos/${id}/stats`}>
            <Button className="fgb-btn-primary h-12 px-8">
              <Activity className="w-4 h-4 mr-2" />
              {game.status === 'finished' ? 'Visualizar Stats' : 'Lançar Stats'}
            </Button>
          </Link>
          
          {game.status !== 'finished' && (
            <Button 
              onClick={() => setFinalizeModalOpen(true)}
              className="bg-[var(--accent)] text-white hover:bg-[var(--accent)] hover:opacity-90 h-12 px-8 font-black uppercase tracking-widest text-[10px]"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Encerrar Jogo
            </Button>
          )}
        </div>
      </div>

      {/* Confronto Card */}
      <div className="fgb-card p-0 overflow-hidden border-t-8 border-t-[var(--verde)] shadow-2xl">
        <div className="p-8 md:p-12 bg-gradient-to-b from-white to-[var(--gray-l)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Mandante */}
            <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right">
              <div className="w-24 h-24 mb-4 flex items-center justify-center bg-white rounded-full shadow-inner border border-[var(--border)] overflow-hidden p-2">
                {game.home_team?.logo_url ? (
                  <img src={game.home_team.logo_url} alt={game.home_team.name} className="w-full h-full object-contain" />
                ) : (
                  <Shield className="w-12 h-12 text-[var(--border)]" />
                )}
              </div>
              <h2 className="fgb-display text-2xl text-[var(--black)] uppercase tracking-tight">{game.home_team?.name}</h2>
              <span className="fgb-label text-[var(--gray)] text-[10px] uppercase tracking-widest mt-1">Mandante</span>
            </div>

            {/* Placar / Centro */}
            <div className="flex flex-col items-center">
              <div className="fgb-label text-[var(--gray)] text-[10px] mb-4 uppercase font-bold tracking-widest">
                {game.status === 'live' ? (
                  <Badge variant="orange" withDot>Ao Vivo</Badge>
                ) : game.status === 'finished' ? (
                  <Badge variant="success">Finalizado</Badge>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Badge variant="outline">Agendado</Badge>
                    {rosters.length === 0 ? (
                      <Badge className="bg-rose-100 text-rose-700 border-rose-200">Roster Não Definido</Badge>
                    ) : rosters.every(r => r.is_locked) ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Roster Travado</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">Roster Salvo</Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-7xl font-sans font-black text-[var(--black)] tabular-nums tracking-tighter shadow-sm">
                  {game.home_score ?? '-'}
                </div>
                <div className="text-[var(--border)] text-3xl font-black font-sans opacity-50">vs</div>
                <div className="text-7xl font-sans font-black text-[var(--black)] tabular-nums tracking-tighter shadow-sm">
                  {game.away_score ?? '-'}
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-[var(--black)] text-sm font-black uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-[var(--verde)]" />
                  {new Date(game.scheduled_at).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </div>
                <div className="flex items-center gap-2 text-[var(--gray)] text-xs font-medium">
                  <MapPin className="w-4 h-4 text-[var(--verde)] opacity-50" />
                  {game.venue || 'Local não definido'}
                </div>
              </div>
            </div>

            {/* Visitante */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="w-24 h-24 mb-4 flex items-center justify-center bg-white rounded-full shadow-inner border border-[var(--border)] overflow-hidden p-2">
                {game.away_team?.logo_url ? (
                  <img src={game.away_team.logo_url} alt={game.away_team.name} className="w-full h-full object-contain" />
                ) : (
                  <Shield className="w-12 h-12 text-[var(--border)]" />
                )}
              </div>
              <h2 className="fgb-display text-2xl text-[var(--black)] uppercase tracking-tight">{game.away_team?.name}</h2>
              <span className="fgb-label text-[var(--gray)] text-[10px] uppercase tracking-widest mt-1">Visitante</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Atletas Mandante */}
        <div className="fgb-card flex flex-col gap-4 p-6 hover:shadow-lg transition-all border border-[rgba(var(--foreground-rgb),0.05)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[var(--verde)]" />
              <h3 className="fgb-label text-[var(--black)]" style={{ fontSize: 12 }}>Atletas Mandante</h3>
            </div>
            <span className="text-2xl font-black text-[var(--black)]">{stats.filter(s => s.team_id === game.home_team_id).length}/{eligibleCounts.home}</span>
          </div>
          <div className="w-full bg-[var(--gray-l)] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[var(--verde)] h-full transition-all duration-700" 
              style={{ width: `${eligibleCounts.home > 0 ? (stats.filter(s => s.team_id === game.home_team_id).length / eligibleCounts.home) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Atletas Visitante */}
        <div className="fgb-card flex flex-col gap-4 p-6 hover:shadow-lg transition-all border border-[rgba(var(--foreground-rgb),0.05)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[var(--verde)]" />
              <h3 className="fgb-label text-[var(--black)]" style={{ fontSize: 12 }}>Atletas Visitante</h3>
            </div>
            <span className="text-2xl font-black text-[var(--black)]">{stats.filter(s => s.team_id === game.away_team_id).length}/{eligibleCounts.away}</span>
          </div>
          <div className="w-full bg-[var(--gray-l)] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[var(--verde)] h-full transition-all duration-700" 
              style={{ width: `${eligibleCounts.away > 0 ? (stats.filter(s => s.team_id === game.away_team_id).length / eligibleCounts.away) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Comparativo de Placar */}
        <div className={`fgb-card flex flex-col gap-4 p-6 transition-all border ${!consistency.isConsistent ? 'border-amber-400 bg-amber-50 shadow-amber-100 shadow-lg' : 'border-[rgba(var(--foreground-rgb),0.05)] hover:shadow-lg'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!consistency.isConsistent ? <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              <h3 className="fgb-label text-[var(--black)]" style={{ fontSize: 12 }}>Status de Consistência</h3>
            </div>
            {!consistency.isConsistent && (
              <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase">Alerta</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/50 p-3 rounded-lg border border-[var(--border)] overflow-hidden">
              <span className="block text-[8px] font-black text-[var(--gray)] uppercase tracking-widest mb-1 leading-none">Placar Manual</span>
              <span className="block font-sans font-black text-lg text-[var(--black)]">{consistency.manualHome} x {consistency.manualAway}</span>
            </div>
            <div className="bg-white/50 p-3 rounded-lg border border-[var(--border)] overflow-hidden">
              <span className="block text-[8px] font-black text-[var(--gray)] uppercase tracking-widest mb-1 leading-none">Total Stats</span>
              <span className="block font-sans font-black text-lg text-[var(--black)]">{consistency.calculatedHome} x {consistency.calculatedAway}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notas / Outros Detalhes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="fgb-card p-6">
          <h3 className="fgb-label text-[var(--black)] mb-4" style={{ fontSize: 12 }}>Observações da Partida</h3>
          <div className="text-sm text-[var(--gray)] italic leading-relaxed bg-[var(--gray-l)]/50 p-5 rounded-2xl border border-[var(--border)] min-h-[120px] whitespace-pre-wrap">
            {game.notes || 'Nenhuma observação cadastrada para este jogo.'}
          </div>
        </div>

        <div className="fgb-card p-0 overflow-hidden bg-[var(--black)] text-white shadow-xl">
          <div className="p-8">
            <h3 className="fgb-label text-white mb-6 uppercase tracking-widest" style={{ fontSize: 14 }}>Estado do Jogo</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${game.status === 'finished' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    {game.status === 'finished' ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-tight">Status Atual</span>
                    <span className="block text-sm opacity-60 font-medium">
                      {game.status === 'finished' ? 'Oficialmente Encerrado' : 'Aguardando Fechamento'}
                    </span>
                  </div>
                </div>
                <Badge variant={game.status === 'finished' ? 'success' : 'orange'}>
                  {game.status}
                </Badge>
              </div>

              {game.status === 'finished' && (
                <div className="flex items-center gap-3 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400">
                  <Lock className="w-5 h-5" />
                  <span className="text-xs font-bold leading-tight">
                    Edições estão bloqueadas. <br/>
                    A classificação e o ranking foram atualizados.
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={`p-4 text-center ${game.status === 'finished' ? 'bg-emerald-600' : 'bg-[var(--accent)]'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4" /> 
              {game.status === 'finished' ? 'Resultado Consolidado pela Liga' : 'Pendência de Validação Esportiva'}
            </span>
          </div>
        </div>
      </div>

      {/* MODAL DE ENCERRAMENTO */}
      {finalizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="fgb-card w-full max-w-lg p-0 overflow-hidden shadow-2xl border-none">
            <div className="bg-gradient-to-r from-[var(--black)] to-[#222] p-8 text-white relative">
              <h2 className="fgb-display text-2xl mb-2">Encerrar Partida</h2>
              <p className="opacity-60 text-xs font-medium uppercase tracking-wider">Confirme os dados antes de consolidar</p>
              <Trophy className="absolute right-8 bottom-4 w-12 h-12 text-white/10" />
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-[var(--gray)]">Resultado Oficial</span>
                  <span className="text-2xl font-black text-[var(--black)]">
                    {game.home_team.short_name} {game.home_score} x {game.away_score} {game.away_team.short_name}
                  </span>
                </div>

                {!consistency.isConsistent ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase italic">
                      <AlertTriangle className="w-4 h-4" />
                      Inconsistência Detectada
                    </div>
                    <div className="text-amber-800 text-sm leading-snug">
                       A soma dos pontos dos atletas ({consistency.calculatedHome} x {consistency.calculatedAway}) não bate com o placar manual ({consistency.manualHome} x {consistency.manualAway}).
                    </div>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-300 cursor-pointer hover:bg-amber-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={ignoreDiscrepancy} 
                        onChange={(e) => setIgnoreDiscrepancy(e.target.checked)}
                        className="w-4 h-4 accent-amber-600"
                      />
                      <span className="text-xs font-black text-amber-900 uppercase">Confirmar encerramento mesmo com divergência</span>
                    </label>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 text-white rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-emerald-800 font-black text-xs uppercase">Dados Íntegros</span>
                      <span className="block text-emerald-700 text-xs font-medium leading-none mt-1">Placar e estatísticas perfeitamente alinhados.</span>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-[var(--gray-l)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--gray)] leading-relaxed">
                    <strong>IMPORTANTE:</strong> Ao encerrar, os stats serão travados e a classificação geral será atualizada instantaneamente. Esta ação serve como validação oficial da partida.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  disabled={finalizing}
                  variant="ghost" 
                  onClick={() => setFinalizeModalOpen(false)}
                  className="flex-1 h-12 border-[var(--border)] font-bold text-[var(--gray)] uppercase tracking-widest text-[10px]"
                >
                  Cancelar
                </Button>
                <Button 
                  disabled={finalizing || (!consistency.isConsistent && !ignoreDiscrepancy)}
                  onClick={handleFinalize}
                  className={`flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg
                    ${consistency.isConsistent 
                      ? 'bg-[var(--verde)] text-[var(--black)] hover:bg-[var(--verde)] hover:scale-105 active:scale-95' 
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                    }
                  `}
                >
                  {finalizing ? 'Finalizando...' : 'Confirmar Encerramento'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
