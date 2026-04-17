"use client"

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  User, 
  Lock, 
  Unlock, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  ChevronRight,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/Badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card'
import type { Game, Athlete } from '@/types/database'

interface RosterPlayer {
  athlete_id: string;
  name: string;
  jersey_number: number;
  is_starter: boolean;
  is_dnp: boolean;
  status: string;
  in_roster: boolean;
}

interface TeamRoster {
  teamId: string;
  teamName: string;
  players: RosterPlayer[];
  isLocked: boolean;
}

export default function GameRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [game, setGame] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Roster logic
  const [homeRoster, setHomeRoster] = useState<TeamRoster | null>(null)
  const [awayRoster, setAwayRoster] = useState<TeamRoster | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/jogos/${id}/roster`)
      if (!res.ok) throw new Error('Falha ao carregar roster')
      
      const data = await res.json()
      setGame(data.game)

      const mapRoster = (teamId: string, teamName: string) => {
        const teamRosterData = data.rosters.find((r: any) => r.team_id === teamId)
        const teamAthletes = data.athletes.filter((a: Athlete) => a.team_id === teamId)

        const players = teamAthletes.map((a: Athlete) => {
          const inRoster = teamRosterData?.players?.find((p: any) => p.athlete_id === a.id)
          return {
            athlete_id: a.id,
            name: a.name,
            jersey_number: inRoster ? inRoster.jersey_number : (a.jersey_number || 0),
            is_starter: inRoster?.is_starter ?? false,
            is_dnp: inRoster ? !inRoster.is_available : false,
            status: inRoster?.status ?? 'ACTIVE',
            in_roster: !!inRoster
          }
        })

        return {
          teamId,
          teamName,
          players: players.sort((a: any, b: any) => b.in_roster - a.in_roster || a.name.localeCompare(b.name)),
          isLocked: teamRosterData?.is_locked ?? false
        }
      }

      setHomeRoster(mapRoster(data.game.home_team_id, data.game.homeTeam?.name || 'Mandante'))
      setAwayRoster(mapRoster(data.game.away_team_id, data.game.awayTeam?.name || 'Visitante'))

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRoster()
  }, [fetchRoster])

  const handlePlayerUpdate = (
    team: 'home' | 'away', 
    athleteId: string, 
    updates: Partial<RosterPlayer>
  ) => {
    const roster = team === 'home' ? homeRoster : awayRoster
    if (!roster || roster.isLocked) return

    const updateFn = team === 'home' ? setHomeRoster : setAwayRoster
    updateFn(prev => {
      if (!prev) return null
      return {
        ...prev,
        players: prev.players.map(p => 
          p.athlete_id === athleteId ? { ...p, ...updates } : p
        )
      }
    })
    setSuccess(false)
  }

  const handleSave = async (lock: boolean = false) => {
    try {
      setSaving(true)
      setError(null)

      if (lock) {
        // Validação: 5 titulares
        const homeStarters = homeRoster?.players.filter(p => p.in_roster && p.is_starter && !p.is_dnp) || []
        const awayStarters = awayRoster?.players.filter(p => p.in_roster && p.is_starter && !p.is_dnp) || []

        if (homeStarters.length < 5 || awayStarters.length < 5) {
          throw new Error('Cada time precisa de pelo menos 5 titulares elegíveis para travar o roster.')
        }
      }

      const payload = {
        lock,
        rosters: {
          [homeRoster!.teamId]: {
            players: homeRoster!.players.filter(p => p.in_roster)
          },
          [awayRoster!.teamId]: {
            players: awayRoster!.players.filter(p => p.in_roster)
          }
        }
      }

      const res = await fetch(`/api/admin/jogos/${id}/roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao salvar roster')
      }

      setSuccess(true)
      await fetchRoster() // Refresh data to get locked status
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUnlock = async () => {
     if (game?.status === 'finished') {
       setError('Não é possível destravar o roster de um jogo já finalizado.')
       return
     }
     
     try {
       setSaving(true)
       const res = await fetch(`/api/admin/jogos/${id}/roster`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           lock: false,
           rosters: {
             [homeRoster!.teamId]: { players: homeRoster!.players.filter(p => p.in_roster) },
             [awayRoster!.teamId]: { players: awayRoster!.players.filter(p => p.in_roster) }
           }
         })
       })
       if (!res.ok) throw new Error('Erro ao destravar')
       await fetchRoster()
     } catch (err: any) {
       setError(err.message)
     } finally {
       setSaving(false)
     }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse fgb-label text-[var(--gray)] italic">Carregando elenco e roster...</div>
    </div>
  )

  const isLocked = homeRoster?.isLocked || awayRoster?.isLocked

  const RosterColumn = ({ team, type }: { team: TeamRoster, type: 'home' | 'away' }) => {
    const selectedCount = team.players.filter(p => p.in_roster).length
    const starterCount = team.players.filter(p => p.in_roster && p.is_starter).length

    return (
      <div className={`space-y-4 ${isLocked ? 'opacity-90' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
             <div className={`w-3 h-10 ${type === 'home' ? 'bg-[var(--primary)]' : 'bg-[var(--gray)]'} rounded-full`}></div>
             <div>
               <h3 className="fgb-display text-xl leading-none uppercase">{team.teamName}</h3>
               <span className="text-[10px] font-bold text-[var(--gray)] uppercase tracking-tighter">
                 {selectedCount} Jogadores Selecionados • {starterCount} Titulares
               </span>
             </div>
          </div>
        </div>

        <div className="fgb-card p-0 overflow-hidden border border-[var(--border)] shadow-sm">
          <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto">
            {team.players
              .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(p => (
              <div 
                key={p.athlete_id} 
                className={`flex items-center gap-3 p-3 transition-all ${p.in_roster ? 'bg-blue-50/20' : 'bg-transparent'} ${p.is_dnp ? 'grayscale-[0.8] opacity-60' : ''}`}
              >
                <Checkbox 
                  checked={p.in_roster} 
                  disabled={isLocked}
                  onCheckedChange={(checked) => handlePlayerUpdate(type, p.athlete_id, { in_roster: !!checked })}
                  className="w-5 h-5"
                />
                
                <div className="flex-1 flex items-center gap-3">
                   <div className="bg-[var(--gray-l)] w-8 h-8 rounded flex items-center justify-center font-bold text-xs text-[var(--gray)]">
                     {isLocked ? (
                       p.jersey_number
                     ) : (
                       <Input 
                         className="w-8 h-8 p-0 text-center border-none bg-transparent" 
                         value={p.jersey_number} 
                         onChange={e => handlePlayerUpdate(type, p.athlete_id, { jersey_number: parseInt(e.target.value) || 0 })}
                       />
                     )}
                   </div>
                   <div className="flex flex-col">
                     <span className="font-bold text-sm text-[var(--black)] leading-tight">{p.name}</span>
                     {p.is_dnp && <span className="text-[9px] text-rose-600 font-bold uppercase tracking-tight">DNP (Não Joga)</span>}
                   </div>
                </div>

                {p.in_roster && (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLocked}
                      onClick={() => handlePlayerUpdate(type, p.athlete_id, { is_starter: !p.is_starter })}
                      className={`h-7 px-2 text-[10px] uppercase font-black tracking-widest ${p.is_starter ? 'bg-amber-100 text-amber-800' : 'bg-[var(--gray-l)] text-[var(--gray)]'}`}
                    >
                      {p.is_starter ? 'Titular' : 'Reserva'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLocked}
                      onClick={() => handlePlayerUpdate(type, p.athlete_id, { is_dnp: !p.is_dnp })}
                      className={`h-7 px-2 text-[10px] uppercase font-black tracking-widest ${p.is_dnp ? 'bg-rose-100 text-rose-800' : 'bg-[var(--gray-l)] text-[var(--gray)]'}`}
                    >
                      DNP
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-32">
       {/* Header Premium */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 py-6 border-b border-[var(--border)] bg-white/50 backdrop-blur-sm sticky top-0 z-50 -mx-4">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/jogos/${id}`)} className="rounded-full hover:bg-[var(--gray-l)] shadow-sm">
              <ArrowLeft className="w-5 h-5 text-[var(--black)]" />
            </Button>
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                 <h1 className="fgb-display text-3xl text-[var(--black)] leading-none uppercase">Roster Oficial</h1>
                 {isLocked ? (
                   <Badge className="bg-[var(--black)] text-white gap-1.5 py-1 px-3">
                     <Lock className="w-3.5 h-3.5" /> ROSTER TRAVADO
                   </Badge>
                 ) : (
                   <Badge className="bg-[var(--verde)] text-[var(--black)] gap-1.5 py-1 px-3">
                     <Unlock className="w-3.5 h-3.5" /> ROSTER ABERTO
                   </Badge>
                 )}
               </div>
               <p className="fgb-label text-[var(--gray)] text-xs">Prepare o elenco oficial antes do início da partida e do lançamento de scouts.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {isLocked ? (
               <Button 
                variant="outline" 
                className="hover:bg-rose-50 text-rose-600 border-rose-100 font-bold"
                onClick={handleUnlock}
                disabled={saving || game?.status === 'finished'}
               >
                 DESTRAVAR EDIÇÃO
               </Button>
             ) : (
               <>
                 <Button 
                    variant="outline" 
                    className="border-[var(--border)] font-bold px-8 h-12"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                 >
                   SALVAR RASCUNHO
                 </Button>
                 <Button 
                    className="fgb-btn-primary h-12 px-10"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                 >
                   {saving ? 'Validando...' : (
                     <>
                       <ShieldCheck className="w-5 h-5 mr-3" /> CONFIRMAR E TRAVAR
                     </>
                   )}
                 </Button>
               </>
             )}
          </div>
       </div>

       {/* Banner de Feedback */}
       {(error || success) && (
         <div className={`mx-4 p-4 rounded-xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 ${error ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {error ? <AlertTriangle className="w-6 h-6 shrink-0" /> : <CheckCircle2 className="w-6 h-6 shrink-0" />}
            <p className="text-sm font-bold">{error || 'Roster atualizado com sucesso!'}</p>
         </div>
       )}

       {/* Game Widget (Contexto) */}
       {game && (
         <div className="mx-4 card-fgb-glass-modern p-6 border-b-4 border-b-[var(--verde)]">
            <div className="flex items-center justify-center gap-12">
               <div className="text-right">
                  <h4 className="fgb-display text-2xl leading-none text-[var(--black)] uppercase">{game.homeTeam?.name}</h4>
                  <span className="text-[10px] fgb-label text-[var(--gray)]">MANDANTE</span>
               </div>
               <div className="px-8 py-2 bg-[var(--black)] text-white fgb-display text-4xl skew-x-[-10deg] italic">
                  VS
               </div>
               <div className="text-left">
                  <h4 className="fgb-display text-2xl leading-none text-[var(--black)] uppercase">{game.awayTeam?.name}</h4>
                  <span className="text-[10px] fgb-label text-[var(--gray)]">VISITANTE</span>
               </div>
            </div>
         </div>
       )}

       {/* Busca */}
       {!isLocked && (
         <div className="mx-4 relative group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray)] group-focus-within:text-[var(--primary)] transition-colors" />
           <Input 
             className="pl-12 h-14 rounded-2xl border-[var(--border)] bg-white/50 focus:bg-white text-lg font-sans shadow-sm"
             placeholder="Buscar atleta pelo nome..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
         </div>
       )}

       {/* Grid de Times */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
          {homeRoster && <RosterColumn team={homeRoster} type="home" />}
          {awayRoster && <RosterColumn team={awayRoster} type="away" />}
       </div>

       {/* Rodapé de Aviso */}
       <div className="mx-4 flex items-start gap-4 p-6 bg-[var(--gray-l)] rounded-3xl border border-[var(--border)] border-dashed">
          <Info className="w-6 h-6 text-[var(--gray)] shrink-0" />
          <div className="space-y-1">
             <p className="text-sm font-bold text-[var(--black)] uppercase tracking-tight">Instruções de Pré-Jogo</p>
             <p className="text-xs text-[var(--gray)] font-sans leading-relaxed">
               Selecione os atletas que estão fisicamente presentes para a partida. Atletas não selecionados não aparecerão na tela de scout. 
               O travamento é obrigatório para iniciar o live scout e exige pelo menos 5 jogadores regulares em quadra.
               A numeração da camisa é válida apenas para este jogo.
             </p>
          </div>
       </div>
    </div>
  )
}
