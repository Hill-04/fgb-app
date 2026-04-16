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
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/Badge'
import type { GameWithTeams, GameStat } from '@/types/database'

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [game, setGame] = useState<GameWithTeams | null>(null)
  const [stats, setStats] = useState<GameStat[]>([])
  const [loading, setLoading] = useState(true)
  const [eligibleCounts, setEligibleCounts] = useState({ home: 0, away: 0 })

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar dados do jogo e stats
        const res = await fetch(`/api/admin/jogos/${id}/stats`)
        if (res.ok) {
          const data = await res.json()
          setGame(data.game)
          setStats(data.stats)
          
          // Contagem de atletas elegíveis (ativos nos times)
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
    fetchData()
  }, [id])

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

  // Cálculos de Stats
  const homeStats = stats.filter(s => s.team_id === game.home_team_id)
  const awayStats = stats.filter(s => s.team_id === game.away_team_id)
  
  const calcHomePoints = homeStats.reduce((acc, s) => acc + (s.points || 0), 0)
  const calcAwayPoints = awayStats.reduce((acc, s) => acc + (s.points || 0), 0)
  
  const hasDiscrepancy = 
    (game.home_score !== null && game.home_score !== calcHomePoints) ||
    (game.away_score !== null && game.away_score !== calcAwayPoints)

  const playersWithStats = {
    home: homeStats.length,
    away: awayStats.length
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
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
        <div className="flex gap-2">
          <Link href={`/admin/jogos/${id}/stats`}>
            <Button className="fgb-btn-primary h-10 px-6">
              <BarChart3 className="w-4 h-4 mr-2" />
              Lançar Stats
            </Button>
          </Link>
          <Button variant="outline" disabled className="h-10 border-[var(--border)] text-[var(--gray)]">
            <Settings className="w-4 h-4 mr-2" />
            Editar Jogo
          </Button>
        </div>
      </div>

      {/* Confronto Card */}
      <div className="fgb-card p-0 overflow-hidden border-t-4 border-t-[var(--verde)] shadow-xl">
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
              <h2 className="fgb-display text-2xl text-[var(--black)]">{game.home_team?.name}</h2>
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
                  'Agendado'
                )}
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-6xl font-black text-[var(--black)] font-sans tabular-nums">
                  {game.home_score ?? '-'}
                </div>
                <div className="text-[var(--border)] text-2xl font-bold font-sans">vs</div>
                <div className="text-6xl font-black text-[var(--black)] font-sans tabular-nums">
                  {game.away_score ?? '-'}
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-[var(--gray)] text-sm font-bold">
                  <Calendar className="w-4 h-4 text-[var(--verde)]" />
                  {new Date(game.scheduled_at).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </div>
                <div className="flex items-center gap-2 text-[var(--gray)] text-xs">
                  <MapPin className="w-4 h-4 text-[var(--verde)]" />
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
              <h2 className="fgb-display text-2xl text-[var(--black)]">{game.away_team?.name}</h2>
              <span className="fgb-label text-[var(--gray)] text-[10px] uppercase tracking-widest mt-1">Visitante</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Atletas Mandante */}
        <div className="fgb-card flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--verde)]" />
              <h3 className="fgb-label text-[var(--black)]" style={{ fontSize: 12 }}>Atletas Mandante</h3>
            </div>
            <span className="text-2xl font-black text-[var(--black)]">{playersWithStats.home}/{eligibleCounts.home}</span>
          </div>
          <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[var(--verde)] h-full transition-all duration-500" 
              style={{ width: `${eligibleCounts.home > 0 ? (playersWithStats.home / eligibleCounts.home) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--gray)] font-sans italic">
            Participantes com estatísticas lançadas para este jogo.
          </p>
        </div>

        {/* Atletas Visitante */}
        <div className="fgb-card flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--verde)]" />
              <h3 className="fgb-label text-[var(--black)]" style={{ fontSize: 12 }}>Atletas Visitante</h3>
            </div>
            <span className="text-2xl font-black text-[var(--black)]">{playersWithStats.away}/{eligibleCounts.away}</span>
          </div>
          <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[var(--verde)] h-full transition-all duration-500" 
              style={{ width: `${eligibleCounts.away > 0 ? (playersWithStats.away / eligibleCounts.away) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--gray)] font-sans italic">
            Participantes com estatísticas lançadas para este jogo.
          </p>
        </div>

        {/* Comparativo de Placar */}
        <div className={`fgb-card flex flex-col gap-4 p-6 transition-colors ${hasDiscrepancy ? 'border-amber-200 bg-amber-50' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasDiscrepancy ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              <h3 className="fgb-label text-[var(--black)]" style={{ fontSize: 12 }}>Conferência de Placar</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-[var(--border)] shadow-sm">
              <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>PLACAR MANUAL</span>
              <span className="font-sans font-black text-[var(--black)]">{game.home_score ?? 0} x {game.away_score ?? 0}</span>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-[var(--border)] shadow-sm">
              <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>SOMA DE STATS</span>
              <span className="font-sans font-black text-[var(--black)]">{calcHomePoints} x {calcAwayPoints}</span>
            </div>
          </div>

          {hasDiscrepancy && (
            <div className="text-amber-700 text-[10px] font-bold uppercase tracking-tight text-center leading-tight">
              A soma dos pontos dos atletas <br/> não coincide com o placar manual!
            </div>
          )}
        </div>
      </div>

      {/* Notas / Outros Detalhes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="fgb-card p-6">
          <h3 className="fgb-label text-[var(--black)] mb-4" style={{ fontSize: 12 }}>Observações da Partida</h3>
          <div className="text-sm text-[var(--gray)] italic leading-relaxed bg-[var(--gray-l)] p-4 rounded-xl border border-[var(--border)] min-h-[100px]">
            {game.notes || 'Nenhuma observação cadastrada para este jogo.'}
          </div>
        </div>

        <div className="fgb-card p-0 overflow-hidden bg-[var(--black)] text-white">
          <div className="p-6">
            <h3 className="fgb-label text-white mb-4" style={{ fontSize: 12 }}>Próximos Passos (Fase 3)</h3>
            <ul className="space-y-3 opacity-80">
              <li className="flex items-center text-xs gap-3">
                <CheckCircle2 className="w-4 h-4 text-[var(--verde)]" /> Fechamento Oficial (Congelar Stats)
              </li>
              <li className="flex items-center text-xs gap-3 opacity-50">
                <Lock className="w-4 h-4" /> Atualizar Ranking da Temporada
              </li>
              <li className="flex items-center text-xs gap-3 opacity-50">
                <Lock className="w-4 h-4" /> Notificações de Destaque
              </li>
            </ul>
          </div>
          <div className="bg-[var(--verde)] p-3 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Fase 2 em andamento</span>
          </div>
        </div>
      </div>
    </div>
  )
}
