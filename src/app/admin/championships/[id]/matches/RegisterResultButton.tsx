'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Shield, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'

interface Player {
  id: string
  name: string
  number: number | null
}

interface TeamData {
  id: string
  name: string
  players: Player[]
}

interface GameDetails {
  homeTeam: TeamData
  awayTeam: TeamData
}

export function RegisterResultButton({ gameId }: { gameId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [details, setDetails] = useState<GameDetails | null>(null)
  
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  
  // Store player stats: { userId: { points, fouls, assists, rebounds, blocks, steals, threePoints, teamId } }
  const [playerStats, setPlayerStats] = useState<Record<string, {
    points: number; fouls: number; assists: number; rebounds: number
    blocks: number; steals: number; threePoints: number; teamId: string
  }>>({})
  const [errorMessage, setErrorMessage] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    if (showModal && !details) {
      fetchDetails()
    }
  }, [showModal])

  const fetchDetails = async () => {
    setFetching(true)
    try {
      const res = await fetch(`/api/games/${gameId}/details`)
      if (res.ok) {
        const data = await res.json()
        setDetails(data)
        
        // Initialize stats maps
        const initialStats: Record<string, {
          points: number; fouls: number; assists: number; rebounds: number
          blocks: number; steals: number; threePoints: number; teamId: string
        }> = {}
        const emptyStats = { points: 0, fouls: 0, assists: 0, rebounds: 0, blocks: 0, steals: 0, threePoints: 0 }
        data.homeTeam.players.forEach((p: Player) => {
          initialStats[p.id] = { ...emptyStats, teamId: data.homeTeam.id }
        })
        data.awayTeam.players.forEach((p: Player) => {
          initialStats[p.id] = { ...emptyStats, teamId: data.awayTeam.id }
        })
        setPlayerStats(initialStats)
      }
    } finally {
      setFetching(false)
    }
  }

  const handleStatChange = (userId: string, field: 'points' | 'fouls' | 'assists' | 'rebounds' | 'blocks' | 'steals' | 'threePoints', value: string) => {
    const numValue = parseInt(value) || 0
    setPlayerStats(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: numValue }
    }))

    // Optional: Auto-update team score based on individual points
    // This is tricky because the user might want to enter total score manually too.
    // We'll let them do both but maybe add a "Sum" button later.
  }

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return
    setLoading(true)
    setErrorMessage('')
    try {
      // Format player stats for API
      const statsArray = Object.entries(playerStats).map(([userId, stats]) => ({
        userId,
        ...stats
      })).filter(s =>
        s.points > 0 || s.fouls > 0 || s.assists > 0 || s.rebounds > 0 ||
        s.blocks > 0 || s.steals > 0 || s.threePoints > 0
      )

      const res = await fetch(`/api/games/${gameId}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
          status: 'FINISHED',
          playerStats: statsArray
        })
      })
      if (res.ok) {
        setShowModal(false)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({ error: 'Erro ao salvar resultado' }))
        setErrorMessage(data.error || 'Erro ao salvar resultado')
      }
    } finally {
      setLoading(false)
    }
  }

  const STAT_FIELDS: { key: 'points' | 'fouls' | 'assists' | 'rebounds' | 'blocks' | 'steals' | 'threePoints'; label: string; color?: string }[] = [
    { key: 'points',      label: 'PTS' },
    { key: 'threePoints', label: '3PT' },
    { key: 'assists',     label: 'AST' },
    { key: 'rebounds',    label: 'REB' },
    { key: 'blocks',      label: 'BLK' },
    { key: 'steals',      label: 'STL' },
    { key: 'fouls',       label: 'FLT', color: 'var(--red)' },
  ]

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-[8px] font-black uppercase tracking-widest text-[var(--verde)] bg-[var(--verde)]/10 border border-[var(--verde)]/20 px-3 py-1.5 rounded-full hover:bg-[var(--verde)]/20 transition-all shadow-sm"
      >
        + Resultado/Cestinhas
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl relative overflow-hidden flex flex-col">
            {/* FGB tricolor accent bar */}
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(to right,#1B7340 33%,#F5C200 33% 66%,#CC1016 66%)' }} />

            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--gray-l)]/30">
              <div>
                <p className="fgb-display text-xl text-[var(--black)] leading-none">Registrar Jogo</p>
                <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>
                  Placar Geral e Cestinhas (Pontuação Individual)
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="fgb-label text-[var(--gray)] hover:text-[var(--red)] transition-colors"
              >
                Fechar [ESC]
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {fetching ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-[var(--verde)] animate-spin" />
                  <p className="fgb-label text-[var(--gray)]">Carregando lista de atletas...</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Global Score Section */}
                  <div className="bg-[var(--gray-l)] p-8 rounded-2xl border border-[var(--border)]">
                    <div className="flex items-center justify-center gap-10">
                      <div className="flex-1 text-right">
                        <p className="fgb-display text-sm text-[var(--black)] truncate">{details?.homeTeam.name}</p>
                        <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>MANDANTE</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          value={homeScore}
                          onChange={e => setHomeScore(e.target.value)}
                          placeholder="0"
                          className="w-24 h-24 bg-white border-2 border-[var(--border)] rounded-2xl text-5xl font-black text-[var(--black)] text-center focus:outline-none focus:border-[var(--verde)] transition-all"
                        />
                        <span className="text-2xl font-black text-[var(--gray)]">×</span>
                        <input
                          type="number"
                          value={awayScore}
                          onChange={e => setAwayScore(e.target.value)}
                          placeholder="0"
                          className="w-24 h-24 bg-white border-2 border-[var(--border)] rounded-2xl text-5xl font-black text-[var(--black)] text-center focus:outline-none focus:border-[var(--verde)] transition-all"
                        />
                      </div>

                      <div className="flex-1 text-left">
                        <p className="fgb-display text-sm text-[var(--black)] truncate">{details?.awayTeam.name}</p>
                        <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>VISITANTE</p>
                      </div>
                    </div>
                  </div>

                  {/* Player Stats Section */}
                  {[
                    { team: details?.homeTeam, accent: 'var(--verde)' },
                    { team: details?.awayTeam, accent: 'var(--red)' },
                  ].map(({ team, accent }) => team && (
                    <div key={team.id} className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                        <Shield className="w-4 h-4" style={{ color: accent }} />
                        <h4 className="fgb-display text-xs text-[var(--black)] uppercase">{team.name}</h4>
                      </div>
                      {/* Header row */}
                      <div className="flex items-center gap-1 px-3">
                        <div className="flex-1 min-w-0" />
                        {STAT_FIELDS.map(f => (
                          <div key={f.key} className="w-10 text-center">
                            <span className="text-[7px] font-black uppercase" style={{ color: f.color || 'var(--gray)' }}>{f.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                        {team.players.map(player => (
                          <div key={player.id} className="flex items-center gap-1 p-2 bg-white border border-[var(--border)] rounded-xl hover:border-[var(--verde)]/40 transition-all">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-6 shrink-0 text-[10px] font-black text-[var(--gray)]">#{player.number || '--'}</span>
                              <p className="text-[10px] font-bold text-[var(--black)] truncate uppercase">{player.name}</p>
                            </div>
                            {STAT_FIELDS.map(f => (
                              <input
                                key={f.key}
                                type="number"
                                min="0"
                                value={playerStats[player.id]?.[f.key] || ''}
                                onChange={(e) => handleStatChange(player.id, f.key, e.target.value)}
                                placeholder="0"
                                className="w-10 h-8 text-center text-xs font-black border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--verde)]"
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {errorMessage && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-[var(--border)] flex gap-4 bg-[var(--gray-l)]/30">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] bg-white border border-[var(--border)] rounded-xl hover:border-[var(--black)] hover:text-[var(--black)] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading || fetching}
                className="flex-[2] h-12 text-[10px] font-black uppercase tracking-widest text-[var(--black)] bg-[var(--yellow)] hover:bg-[var(--yellow)]/80 rounded-xl transition-all disabled:opacity-50 shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Resultado e Cestinhas ✓'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
