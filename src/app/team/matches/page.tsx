"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, LayoutGrid, List, Filter, Clock, MapPin, Trophy, CheckCircle2 } from 'lucide-react'
import { RegisterResultButton } from '@/app/admin/championships/[id]/matches/RegisterResultButton'
import { GenerateSumulaButton } from '@/app/admin/championships/[id]/matches/GenerateSumulaButton'

type Game = {
  id: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  homeScore: number | null
  awayScore: number | null
  dateTime: string
  location: string
  status: string
  category: { name: string }
}

type Championship = {
  id: string
  name: string
  categories: { id: string; name: string }[]
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SCHEDULED:   { label: 'Agendado',    bg: 'bg-[var(--gray-l)]',       text: 'text-[var(--gray)]',  border: 'border-[var(--border)]' },
  IN_PROGRESS: { label: 'Em Andamento',bg: 'bg-[var(--yellow)]/20',    text: 'text-[var(--black)]', border: 'border-[var(--yellow)]/40' },
  FINISHED:    { label: 'Encerrado',   bg: 'bg-[var(--verde)]/10',     text: 'text-[var(--verde)]', border: 'border-[var(--verde)]/20' },
  CANCELLED:   { label: 'Cancelado',   bg: 'bg-[var(--red)]/10',       text: 'text-[var(--red)]',   border: 'border-[var(--red)]/20' },
}

export default function TeamMatchesPage() {
  const { data: session } = useSession()
  const teamId = (session?.user as any)?.teamId

  const [games, setGames] = useState<Game[]>([])
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChamp, setSelectedChamp] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [onlyMyTeam, setOnlyMyTeam] = useState(true)
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD')

  const fetchData = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    try {
      const champRes = await fetch('/api/championships')
      if (champRes.ok) setChampionships(await champRes.json())

      const url = new URL('/api/admin/games', window.location.origin)
      if (selectedChamp) url.searchParams.set('championshipId', selectedChamp)
      if (selectedCat) url.searchParams.set('categoryId', selectedCat)
      if (onlyMyTeam) url.searchParams.set('teamId', teamId)

      const gameRes = await fetch(url.toString())
      if (gameRes.ok) setGames(await gameRes.json())
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedChamp, selectedCat, onlyMyTeam, teamId])

  useEffect(() => { fetchData() }, [fetchData])

  const scheduled = games.filter(g => g.status === 'SCHEDULED' || g.status === 'IN_PROGRESS').length
  const finished  = games.filter(g => g.status === 'FINISHED').length

  const gamesByDate = games.reduce((acc, game) => {
    const dateKey = new Date(game.dateTime).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(game)
    return acc
  }, {} as Record<string, typeof games>)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>Minha Equipe</span>
            <span className="fgb-badge fgb-badge-verde">JOGOS</span>
          </div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Jogos e Resultados</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Agenda completa e histórico de partidas da sua equipe
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[var(--gray-l)] border border-[var(--border)] p-1 rounded-xl self-start md:self-auto">
          {(['CARD', 'TABLE'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 h-8 px-4 rounded-lg fgb-label transition-all ${
                viewMode === mode
                  ? 'bg-white border border-[var(--border)] text-[var(--black)] shadow-sm'
                  : 'text-[var(--gray)] hover:text-[var(--black)]'
              }`}
              style={{ fontSize: 9 }}
            >
              {mode === 'CARD' ? <><LayoutGrid className="w-3 h-3" /> Cards</> : <><List className="w-3 h-3" /> Tabela</>}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="fgb-card bg-white p-4 border-t-[3px] border-t-[var(--verde)]">
          <p className="fgb-display text-3xl text-[var(--black)] leading-none">{games.length}</p>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 9 }}>Total de Jogos</p>
        </div>
        <div className="fgb-card bg-white p-4 border-t-[3px] border-t-[var(--yellow)]">
          <p className="fgb-display text-3xl text-[var(--black)] leading-none">{scheduled}</p>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 9 }}>Agendados</p>
        </div>
        <div className="fgb-card bg-white p-4 border-t-[3px] border-t-[var(--verde)]">
          <p className="fgb-display text-3xl text-[var(--verde)] leading-none">{finished}</p>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 9 }}>Realizados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="fgb-card bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--gray)]" />
            <span className="fgb-label text-[var(--black)]" style={{ fontSize: 9 }}>Filtros</span>
          </div>
          <button
            onClick={() => setOnlyMyTeam(!onlyMyTeam)}
            className={`fgb-label px-3 py-1.5 rounded-full border transition-all ${
              onlyMyTeam
                ? 'bg-[var(--verde)]/10 border-[var(--verde)]/30 text-[var(--verde)]'
                : 'bg-[var(--gray-l)] border-[var(--border)] text-[var(--gray)]'
            }`}
            style={{ fontSize: 9 }}
          >
            {onlyMyTeam ? '✓ Apenas minha equipe' : 'Todas as equipes'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Campeonato</label>
            <select
              value={selectedChamp}
              onChange={e => { setSelectedChamp(e.target.value); setSelectedCat('') }}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-11 rounded-xl px-3 text-sm font-sans text-[var(--black)] focus:outline-none focus:border-[var(--verde)] transition-colors"
            >
              <option value="">Todos os Campeonatos</option>
              {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Categoria</label>
            <select
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              disabled={!selectedChamp}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-11 rounded-xl px-3 text-sm font-sans text-[var(--black)] focus:outline-none focus:border-[var(--verde)] transition-colors disabled:opacity-50"
            >
              <option value="">Todas as Categorias</option>
              {championships.find(c => c.id === selectedChamp)?.categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="fgb-card bg-white h-52 animate-pulse" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="fgb-card bg-white p-20 text-center">
          <Calendar className="w-12 h-12 text-[var(--gray)] mx-auto mb-4 opacity-30" />
          <h3 className="fgb-display text-lg text-[var(--black)] mb-2">Nenhuma partida encontrada</h3>
          <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Não há jogos agendados com os filtros atuais.
          </p>
        </div>
      ) : viewMode === 'CARD' ? (
        <div className="space-y-10">
          {Object.entries(gamesByDate).map(([date, dayGames]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-3 py-2 sticky top-[72px] bg-[var(--background)] z-10">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-[10px] font-black font-sans uppercase tracking-widest text-[var(--black)] px-4 py-1.5 bg-[var(--yellow)] border border-[var(--orange-dark)]/20 rounded-full shadow-sm">
                  {date}
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <div className="grid gap-3 font-sans">
                {dayGames.map(game => {
                  const st = STATUS_CONFIG[game.status] ?? STATUS_CONFIG.SCHEDULED
                  const isFinished = game.status === 'FINISHED'
                  return (
                    <div key={game.id} className="fgb-card bg-white p-5 flex items-center gap-6 hover:border-[var(--black)] transition-all group shadow-sm">
                      {/* Horário */}
                      <div className="text-center flex-shrink-0 w-16 group-hover:scale-105 transition-transform">
                        <p className="text-base font-black text-[var(--black)]">
                          {new Date(game.dateTime).toLocaleTimeString('pt-BR', {
                            hour: '2-digit', minute: '2-digit',
                            timeZone: 'America/Sao_Paulo'
                          })}
                        </p>
                        <span className={`text-[8px] font-black uppercase tracking-widest mt-1 inline-block px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                          {st.label}
                        </span>
                      </div>

                      {/* Divisor */}
                      <div className="w-px h-12 bg-[var(--border)] hidden md:block" />

                      {/* Confronto */}
                      <div className="flex-1 flex items-center gap-4 min-w-0">
                        {/* Mandante */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-black uppercase text-[var(--black)] truncate text-right">
                            {game.homeTeam.name}
                          </span>
                        </div>

                        {/* Score / VS */}
                        <div className="flex-shrink-0 w-24 flex justify-center">
                          {isFinished ? (
                            <div className="flex items-center gap-2 bg-[var(--gray-l)] px-3 py-1 rounded-xl border border-[var(--border)]">
                              <span className="text-xl font-black text-[var(--black)] tabular-nums">{game.homeScore}</span>
                              <span className="text-[var(--gray)] font-black text-xs">×</span>
                              <span className="text-xl font-black text-[var(--black)] tabular-nums">{game.awayScore}</span>
                            </div>
                          ) : (
                            <div className="px-3 py-1 rounded-full bg-[var(--gray-l)] border border-[var(--border)]">
                               <span className="text-[10px] font-black italic text-[var(--gray)] uppercase">vs</span>
                            </div>
                          )}
                        </div>

                        {/* Visitante */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-sm font-black uppercase text-[var(--black)] truncate">
                            {game.awayTeam.name}
                          </span>
                        </div>
                      </div>

                        {/* Divisor */}
                        <div className="w-px h-12 bg-[var(--border)] hidden md:block" />

                        {/* Categoria + Local + Ações */}
                        <div className="hidden md:flex flex-col items-end justify-center gap-1.5 flex-shrink-0 w-32">
                          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--black)] bg-[var(--yellow)]/30 border border-[var(--amarelo)]/20 px-2 py-0.5 rounded-full mb-1">
                            {game.category.name}
                          </span>
                          
                          {isFinished ? (
                            <div className="flex flex-col gap-2 items-end">
                              <span className="text-[8px] font-black uppercase tracking-widest text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-2 h-2" /> Encerrado
                              </span>
                              <GenerateSumulaButton gameId={game.id} />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 items-end">
                              <RegisterResultButton gameId={game.id} />
                              <GenerateSumulaButton gameId={game.id} />
                            </div>
                          )}
                        </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="fgb-card bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--gray-l)]">
                  {['Status', 'Data', 'Categoria', 'Confronto', 'Local'].map(h => (
                    <th key={h} className="px-5 py-3 fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {games.map(game => {
                  const st = STATUS_CONFIG[game.status] ?? STATUS_CONFIG.SCHEDULED
                  const isFinished = game.status === 'FINISHED'
                  return (
                    <tr key={game.id} className="hover:bg-[var(--gray-l)]/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className={`fgb-label px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`} style={{ fontSize: 8 }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 fgb-label text-[var(--black)]" style={{ fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
                        {new Date(game.dateTime).toLocaleDateString('pt-BR')}
                        <br />
                        <span className="text-[var(--gray)]">{new Date(game.dateTime).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', timeZone: 'America/Sao_Paulo' })}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="fgb-display text-xs text-[var(--black)]">{game.category.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 font-sans">
                          <span className="text-xs font-bold text-[var(--black)] text-right flex-1 truncate italic uppercase">{game.homeTeam.name}</span>
                          <span className="fgb-display text-base text-[var(--verde)] flex-shrink-0">
                            {isFinished ? `${game.homeScore} × ${game.awayScore}` : 'vs'}
                          </span>
                          <span className="text-xs font-bold text-[var(--black)] flex-1 truncate italic uppercase">{game.awayTeam.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 fgb-label text-[var(--gray)] truncate max-w-[140px]" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>
                        {game.location || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
