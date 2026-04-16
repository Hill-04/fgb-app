"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, Calendar, MapPin, Trophy, Save, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Team } from '@/types/database'

export default function AdminNovoJogoPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [venue, setVenue] = useState('')
  const [round, setRound] = useState('')

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch('/api/teams/supabase')
        if (res.ok) {
          const data = await res.json()
          setTeams(data)
        }
      } catch (err) {
        console.error('Erro ao buscar times:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTeams()
  }, [])

  const homeTeam = teams.find(t => t.id === homeTeamId)
  const awayTeam = teams.find(t => t.id === awayTeamId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!homeTeamId || !awayTeamId || !date || !time) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (homeTeamId === awayTeamId) {
      setError('O time mandante deve ser diferente do visitante.')
      return
    }

    setSubmitLoading(true)
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString()
      
      const res = await fetch('/api/admin/jogos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          scheduled_at: scheduledAt,
          venue,
          round: round ? parseInt(round) : null
        })
      })

      if (res.ok) {
        router.push('/admin/jogos')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Erro ao criar jogo')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/jogos">
          <Button variant="ghost" size="icon" className="rounded-full bg-white border border-[var(--border)] shadow-sm hover:bg-[var(--gray-l)]">
            <ArrowLeft className="w-5 h-5 text-[var(--gray)]" />
          </Button>
        </Link>
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)] leading-none mb-1">Novo Jogo</h1>
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Configurar novo confronto na temporada</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="fgb-card p-8 bg-white space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">Mandante (Home)</Label>
                  <select 
                    value={homeTeamId}
                    onChange={e => setHomeTeamId(e.target.value)}
                    className="w-full h-12 bg-white border border-[var(--border)] rounded-xl px-4 text-sm font-sans focus:ring-1 focus:ring-[var(--verde)] focus:outline-none shadow-sm transition-all"
                    required
                  >
                    <option value="">Selecione o time</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">Visitante (Away)</Label>
                  <select 
                    value={awayTeamId}
                    onChange={e => setAwayTeamId(e.target.value)}
                    className="w-full h-12 bg-white border border-[var(--border)] rounded-xl px-4 text-sm font-sans focus:ring-1 focus:ring-[var(--verde)] focus:outline-none shadow-sm transition-all"
                    required
                  >
                    <option value="">Selecione o time</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">Data</Label>
                  <Input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="h-12 border-[var(--border)] rounded-xl focus-visible:ring-[var(--verde)]" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">Hora</Label>
                  <Input 
                    type="time" 
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="h-12 border-[var(--border)] rounded-xl focus-visible:ring-[var(--verde)]" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="fgb-label text-[var(--gray)]">Local / Ginásio</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray)]" />
                  <Input 
                    placeholder="Ex: Ginásio Tesourinha" 
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    className="pl-10 h-12 border-[var(--border)] rounded-xl focus-visible:ring-[var(--verde)]" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="fgb-label text-[var(--gray)]">Rodada (Opcional)</Label>
                <div className="relative">
                  <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray)]" />
                  <Input 
                    type="number" 
                    placeholder="Ex: 1" 
                    value={round}
                    onChange={e => setRound(e.target.value)}
                    className="pl-10 h-12 border-[var(--border)] rounded-xl focus-visible:ring-[var(--verde)]" 
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="fgb-label text-[var(--red)] bg-[var(--red)]/10 p-4 rounded-xl normal-case tracking-normal">
                {error}
              </p>
            )}

            <div className="flex gap-4 pt-4">
              <Link href="/admin/jogos" className="flex-1">
                <Button variant="ghost" type="button" className="w-full h-12 text-[var(--gray)] font-bold hover:bg-[var(--gray-l)]">
                  Cancelar
                </Button>
              </Link>
              <Button disabled={submitLoading} className="flex-1 fgb-btn-primary h-12 shadow-lg shadow-[var(--verde)]/20">
                {submitLoading ? 'Salvando...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Jogo
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="fgb-card bg-[var(--verde)] border-none p-8 text-white relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-48 h-48 -mr-12 -mt-12" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="fgb-label text-white/60 flex items-center gap-2">
                Preview do Confronto <ChevronRight className="w-3 h-3" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col items-center gap-4 flex-1">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden">
                    {homeTeam?.logo_url ? (
                      <img src={homeTeam.logo_url} alt={homeTeam.name} className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-10 h-10 text-white/40" />
                    )}
                  </div>
                  <span className="font-black text-center text-sm uppercase tracking-tight leading-tight min-h-[2.5rem] flex items-center underline decoration-[var(--amarelo)] decoration-2 underline-offset-4">
                    {homeTeam?.name || 'Mandante'}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl font-black text-[var(--amarelo)]">VS</div>
                  <div className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/80">
                    {round ? `Rodada ${round}` : 'Season Game'}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 flex-1">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden">
                    {awayTeam?.logo_url ? (
                      <img src={awayTeam.logo_url} alt={awayTeam.name} className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-10 h-10 text-white/40" />
                    )}
                  </div>
                  <span className="font-black text-center text-sm uppercase tracking-tight leading-tight min-h-[2.5rem] flex items-center">
                    {awayTeam?.name || 'Visitante'}
                  </span>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <Calendar className="w-4 h-4 text-[var(--amarelo)]" />
                  <span className="font-sans">
                    {date ? new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : 'Data a definir'}
                    {time && ` às ${time}`}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <MapPin className="w-4 h-4 text-[var(--amarelo)]" />
                  <span className="font-sans truncate">{venue || 'Local a definir'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="fgb-card border-dashed bg-transparent p-6 text-center space-y-2">
            <h4 className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Dica de Organização</h4>
            <p className="text-xs text-[var(--gray)] font-sans">
              Certifique-se de que os horários não conflitam com outros jogos no mesmo local. 
              O sistema de súmula digital será liberado automaticamente 30 minutos antes do início.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
