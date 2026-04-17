"use client"

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/Badge'
import type { GameStat, Athlete, Game } from '@/types/database'

type ExtendedStat = Partial<GameStat> & { 
  athlete_id: string; 
  team_id: string;
  athlete_name: string;
  jersey?: number;
}

export default function GameStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [game, setGame] = useState<Game | null>(null)
  const [rosterLocked, setRosterLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Mapeamento de stats por atleta
  const [homeStats, setHomeStats] = useState<ExtendedStat[]>([])
  const [awayStats, setAwayStats] = useState<ExtendedStat[]>([])

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/jogos/${id}/stats`)
      if (!res.ok) throw new Error('Falha ao carregar dados')
      
      const data = await res.json()
      setGame(data.game)

      const isLocked = data.rosters?.every((r: any) => r.is_locked) ?? false
      setRosterLocked(isLocked)

      // Se não houver jogadores no roster, avisar
      const rosterPlayers = data.rosters?.flatMap((r: any) => r.players) || []
      if (rosterPlayers.length === 0) {
        throw new Error('Roster oficial não definido para este jogo. Por favor, gerencie o roster primeiro.')
      }

      // Organizar atletas por time e mapear com stats existentes
      const mapStats = (teamId: string) => {
        // Obter jogadores do roster para este time
        const teamRoster = data.rosters?.find((r: any) => r.team_id === teamId)
        const teamRosterPlayers = teamRoster?.players || []

        return teamRosterPlayers.map((rp: any) => {
          const athlete = data.athletes.find((a: Athlete) => a.id === rp.athlete_id)
          const existing = data.stats.find((s: GameStat) => s.athlete_id === rp.athlete_id)
          
          return {
            athlete_id: rp.athlete_id,
            team_id: teamId,
            athlete_name: athlete?.name || 'Atleta Desconhecido',
            jersey: rp.jersey_number,
            dnp: !rp.is_available, // No roster, is_available=false significa DNP
            minutes_played: existing?.minutes_played ?? 0,
            points: existing?.points ?? 0,
            rebounds_offensive: existing?.rebounds_offensive ?? 0,
            rebounds_defensive: existing?.rebounds_defensive ?? 0,
            assists: existing?.assists ?? 0,
            steals: existing?.steals ?? 0,
            blocks: existing?.blocks ?? 0,
            turnovers: existing?.turnovers ?? 0,
            fouls: existing?.fouls ?? 0,
            fg_made: existing?.fg_made ?? 0,
            fg_attempted: existing?.fg_attempted ?? 0,
            three_made: existing?.three_made ?? 0,
            three_attempted: existing?.three_attempted ?? 0,
            ft_made: existing?.ft_made ?? 0,
            ft_attempted: existing?.ft_attempted ?? 0,
            dunks: existing?.dunks ?? 0,
          }
        })
      }

      setHomeStats(mapStats(data.game.home_team_id))
      setAwayStats(mapStats(data.game.away_team_id))

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleInputChange = (
    team: 'home' | 'away', 
    athleteId: string, 
    field: keyof ExtendedStat, 
    value: any
  ) => {
    // Bloquear se o atleta for DNP
    const stats = team === 'home' ? homeStats : awayStats
    const athleteStat = stats.find(s => s.athlete_id === athleteId)
    if (athleteStat?.dnp && field !== 'dnp') return

    const updateFn = team === 'home' ? setHomeStats : setAwayStats
    updateFn(prev => prev.map(s => s.athlete_id === athleteId ? { ...s, [field]: value } : s))
    setSuccess(false)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Filtrar apenas quem NÃO é DNP para salvar stats numéricos,
      // mas a API pode lidar com o objeto completo se quisermos.
      // Manteremos a filtragem por segurança.
      const payload = [...homeStats, ...awayStats].filter(s => !s.dnp)

      const res = await fetch(`/api/admin/jogos/${id}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: payload })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao salvar estatísticas')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const calcTotal = (statsList: ExtendedStat[]) => statsList.reduce((acc, s) => acc + (s.dnp ? 0 : (s.points || 0)), 0)
  const homePoints = calcTotal(homeStats)
  const awayPoints = calcTotal(awayStats)

  const hasManualDiscrepancy = 
    (game?.home_score !== null && game?.home_score !== homePoints) ||
    (game?.away_score !== null && game?.away_score !== awayPoints)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse fgb-label text-[var(--gray)]">Carregando lista de atletas...</div>
    </div>
  )

  const StatTable = ({ title, stats, teamType }: { title: string, stats: ExtendedStat[], teamType: 'home' | 'away' }) => (
    <div className="fgb-card p-0 overflow-hidden shadow-lg border border-[var(--border)]">
      <div className="bg-[var(--black)] p-4 flex items-center justify-between">
        <h3 className="fgb-display text-lg text-white font-black uppercase tracking-widest">{title}</h3>
        <div className="bg-[var(--verde)] text-[var(--black)] px-4 py-1 rounded font-black text-xl">
          {calcTotal(stats)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-sans">
          <thead className="bg-[var(--gray-l)] fgb-label text-[var(--gray)] border-b border-[var(--border)] uppercase">
            <tr>
              <th className="px-4 py-3 text-left min-w-[150px]">Atleta</th>
              <th className="px-2 py-3 text-center">DNP</th>
              <th className="px-2 py-3 text-center">MIN</th>
              <th className="px-2 py-3 text-center bg-emerald-50 text-emerald-800">PTS</th>
              <th className="px-2 py-3 text-center">FGM/A</th>
              <th className="px-2 py-3 text-center">3PM/A</th>
              <th className="px-2 py-3 text-center">FTM/A</th>
              <th className="px-2 py-3 text-center">REB O/D</th>
              <th className="px-2 py-3 text-center">AST</th>
              <th className="px-2 py-3 text-center">STL</th>
              <th className="px-2 py-3 text-center">BLK</th>
              <th className="px-2 py-3 text-center text-rose-800">TO</th>
              <th className="px-2 py-3 text-center">PF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {stats.map(s => (
              <tr key={s.athlete_id} className={`hover:bg-blue-50/30 transition-colors ${s.dnp ? 'opacity-40 bg-gray-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-bold flex items-center gap-2">
                    <span className="bg-[var(--gray-l)] text-[var(--gray)] w-6 h-6 rounded flex items-center justify-center text-[10px]">#{s.jersey}</span>
                    <span className="truncate max-w-[100px]">{s.athlete_name}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center">
                  <input 
                    type="checkbox" 
                    checked={s.dnp}
                    onChange={e => handleInputChange(teamType, s.athlete_id, 'dnp', e.target.checked)}
                    className="w-4 h-4 accent-[var(--verde)]" 
                  />
                </td>
                <td className="px-1 py-2">
                   <Input 
                     type="number" 
                     className="h-8 w-12 text-center p-0 text-[10px]" 
                     value={s.minutes_played}
                     disabled={s.dnp}
                     onChange={e => handleInputChange(teamType, s.athlete_id, 'minutes_played', parseInt(e.target.value) || 0)}
                   />
                </td>
                <td className="px-1 py-2 bg-emerald-50/50">
                   <Input 
                     type="number" 
                     className="h-8 w-12 text-center p-0 text-xs font-black text-emerald-700 pointer-events-none bg-transparent border-none shadow-none" 
                     value={(s.three_made || 0) * 3 + ((s.fg_made || 0) - (s.three_made || 0)) * 2 + (s.ft_made || 0)}
                     readOnly
                   />
                </td>
                <td className="px-1 py-2">
                  <div className="flex gap-0.5 items-center justify-center">
                    <Input className="h-8 w-8 text-center p-0 text-[10px]" value={s.fg_made} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'fg_made', parseInt(e.target.value) || 0)} />
                    <span>/</span>
                    <Input className="h-8 w-8 text-center p-0 text-[10px]" value={s.fg_attempted} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'fg_attempted', parseInt(e.target.value) || 0)} />
                  </div>
                </td>
                <td className="px-1 py-2">
                  <div className="flex gap-0.5 items-center justify-center">
                    <Input className="h-8 w-8 text-center p-0 text-[10px]" value={s.three_made} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'three_made', parseInt(e.target.value) || 0)} />
                    <span>/</span>
                    <Input className="h-8 w-8 text-center p-0 text-[10px]" value={s.three_attempted} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'three_attempted', parseInt(e.target.value) || 0)} />
                  </div>
                </td>
                <td className="px-1 py-2">
                  <div className="flex gap-0.5 items-center justify-center">
                    <Input className="h-8 w-8 text-center p-0 text-[10px]" value={s.ft_made} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'ft_made', parseInt(e.target.value) || 0)} />
                    <span>/</span>
                    <Input className="h-8 w-8 text-center p-0 text-[10px]" value={s.ft_attempted} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'ft_attempted', parseInt(e.target.value) || 0)} />
                  </div>
                </td>
                <td className="px-1 py-2">
                  <div className="flex gap-0.5 items-center justify-center">
                    <Input className="h-8 w-8 text-center p-0 text-[10px]" value={s.rebounds_offensive} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'rebounds_offensive', parseInt(e.target.value) || 0)} />
                    <span>/</span>
                    <Input className="h-8 w-8 text-center p-0 text-[10px]" value={s.rebounds_defensive} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'rebounds_defensive', parseInt(e.target.value) || 0)} />
                  </div>
                </td>
                <td className="px-1 py-2">
                   <Input type="number" className="h-8 w-10 text-center p-0 text-[10px]" value={s.assists} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'assists', parseInt(e.target.value) || 0)} />
                </td>
                <td className="px-1 py-2">
                   <Input type="number" className="h-8 w-10 text-center p-0 text-[10px]" value={s.steals} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'steals', parseInt(e.target.value) || 0)} />
                </td>
                <td className="px-1 py-2">
                   <Input type="number" className="h-8 w-10 text-center p-0 text-[10px]" value={s.blocks} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'blocks', parseInt(e.target.value) || 0)} />
                </td>
                <td className="px-1 py-2 bg-rose-50/30">
                   <Input type="number" className="h-8 w-10 text-center p-0 text-[10px] text-rose-900 font-bold" value={s.turnovers} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'turnovers', parseInt(e.target.value) || 0)} />
                </td>
                <td className="px-1 py-2">
                   <Input type="number" className="h-8 w-10 text-center p-0 text-[10px]" value={s.fouls} disabled={s.dnp} onChange={e => handleInputChange(teamType, s.athlete_id, 'fouls', parseInt(e.target.value) || 0)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-40">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50 bg-white/80 backdrop-blur-md py-4 border-b border-[var(--border)] px-4 -mx-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="fgb-display text-2xl text-[var(--black)] leading-none">Lançamento de Stats</h1>
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Fase 2 de Administração — Jogos com Supabase</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}
          <Button 
            className="fgb-btn-primary px-10 h-11" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Garantindo dados...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                SALVAR ESTATÍSTICAS
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Warning Discrepancy */}
      {hasManualDiscrepancy && (
        <div className="bg-amber-100 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-4 animate-pulse">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Divergência de Placar</p>
                <p className="text-sm font-sans">
                  A soma dos pontos lançados (<b>{homePoints} x {awayPoints}</b>) não coincide com o placar manual cadastrado no jogo (<b>{game?.home_score ?? 0} x {game?.away_score ?? 0}</b>). 
                  Este valor serve apenas para conferência nesta fase.
                </p>
            </div>
        </div>
      )}

      {/* Tables Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <StatTable title="Mandante" stats={homeStats} teamType="home" />
        <StatTable title="Visitante" stats={awayStats} teamType="away" />
      </div>

      {/* Glossário rápido */}
      <div className="bg-[var(--gray-l)] p-4 rounded-xl border border-[var(--border)]">
        <div className="flex items-center gap-2 mb-2 text-[var(--black)] font-bold text-[10px] uppercase">
          <History className="w-4 h-4" /> Breve Glossário
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-4 text-[9px] text-[var(--gray)] font-sans">
          <div><b>MIN:</b> Minutos</div>
          <div><b>PTS:</b> Pontos</div>
          <div><b>FGM/A:</b> Arremessos Convertidos/Tentados</div>
          <div><b>3PM/A:</b> Triplos Convertidos/Tentados</div>
          <div><b>FTM/A:</b> Lances Livres Convertidos/Tentados</div>
          <div><b>REB O/D:</b> Rebotes Ofensivos/Defensivos</div>
          <div><b>AST:</b> Assistências</div>
          <div><b>STL:</b> Roubos</div>
          <div><b>BLK:</b> Tocos</div>
          <div><b>TO:</b> Turnovers</div>
        </div>
      </div>
    </div>
  )
}
