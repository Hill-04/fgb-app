'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MoreVertical, Pencil, Trash2, FileText } from 'lucide-react'

type Game = {
  id: string
  dateTime: string
  status: string
  homeScore: number | null
  awayScore: number | null
  homeTeam: { name: string }
  awayTeam: { name: string }
  category: { name: string }
}

export default function ChampionshipMatchesPage() {
  const params = useParams()
  const id = params.id as string

  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState('')
  const [resultGameId, setResultGameId] = useState<string | null>(null)
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')

  const loadGames = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`/api/games?championshipId=${id}`)
      const data = await resp.json()
      setGames(Array.isArray(data) ? data : [])
    } catch {
      setGames([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGames()
  }, [id])

  const categories = useMemo(() => {
    const set = new Set<string>()
    games.forEach((g) => set.add(g.category.name))
    return Array.from(set).sort()
  }, [games])

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const byCategory = categoryFilter === 'all' || g.category.name === categoryFilter
      const byStatus = statusFilter === 'all' || g.status === statusFilter
      return byCategory && byStatus
    })
  }, [games, categoryFilter, statusFilter])

  const grouped = useMemo(() => {
    const map: Record<string, Game[]> = {}
    filteredGames.forEach((g) => {
      const key = new Date(g.dateTime).toISOString().split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(g)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredGames])

  const startEdit = (game: Game) => {
    setEditingGameId(game.id)
    const dt = new Date(game.dateTime)
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    setEditingDate(local.toISOString().slice(0, 16))
  }

  const submitEdit = async (gameId: string) => {
    if (!editingDate) return
    await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateTime: new Date(editingDate).toISOString() })
    })
    setEditingGameId(null)
    await loadGames()
  }

  const startResult = (game: Game) => {
    setResultGameId(game.id)
    setHomeScore(game.homeScore?.toString() ?? '')
    setAwayScore(game.awayScore?.toString() ?? '')
  }

  const submitResult = async (gameId: string) => {
    await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        status: 'FINISHED'
      })
    })
    setResultGameId(null)
    setHomeScore('')
    setAwayScore('')
    await loadGames()
  }

  const cancelGame = async (gameId: string) => {
    const ok = confirm('Cancelar este jogo?')
    if (!ok) return
    await fetch(`/api/games/${gameId}`, { method: 'DELETE', body: JSON.stringify({ reason: 'Cancelado pelo admin' }) })
    await loadGames()
  }

  if (loading) {
    return <div className="fgb-label text-[var(--gray)]">Carregando jogos...</div>
  }

  if (games.length === 0) {
    return (
      <div className="fgb-card p-10 text-center">
        <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Nenhum jogo gerado ainda. Use a aba Organizar IA.
        </p>
        <Link href={`/admin/championships/${id}/organize`} className="fgb-btn-primary mt-4 inline-flex">
          Organizar com IA
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--border)] px-3 text-sm"
        >
          <option value="all">Todas categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--border)] px-3 text-sm"
        >
          <option value="all">Todos status</option>
          <option value="SCHEDULED">Agendados</option>
          <option value="FINISHED">Encerrados</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>

      {grouped.map(([date, items]) => (
        <div key={date} className="fgb-card p-0 overflow-hidden">
          <div className="px-6 py-3 bg-[var(--gray-l)] border-b border-[var(--border)] flex items-center justify-between">
            <div className="fgb-heading" style={{ fontSize: 14 }}>
              {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
              })}
            </div>
            <span className="fgb-label text-[var(--gray)]">{items.length} jogo(s)</span>
          </div>

          <div className="divide-y divide-[var(--border)] bg-white">
            {items.map((game) => {
              const isFinished = game.status === 'FINISHED'
              const isEditing = editingGameId === game.id
              const isResult = resultGameId === game.id

              return (
                <div key={game.id} className="px-6 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="fgb-label text-[var(--gray)] w-14">
                      {new Date(game.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="fgb-label text-[var(--verde)] text-[9px]">
                      {game.category.name}
                    </span>
                    <span className="fgb-heading flex-1 text-sm">{game.homeTeam.name}</span>
                    <span className={`fgb-heading ${isFinished ? 'text-[var(--orange)]' : 'text-[var(--gray)]'}`}>
                      {isFinished ? game.homeScore : '—'}
                    </span>
                    <span className="fgb-label text-[var(--gray)]">×</span>
                    <span className={`fgb-heading ${isFinished ? 'text-[var(--orange)]' : 'text-[var(--gray)]'}`}>
                      {isFinished ? game.awayScore : '—'}
                    </span>
                    <span className="fgb-heading flex-1 text-sm">{game.awayTeam.name}</span>
                    <StatusBadge status={game.status} />
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => startResult(game)} className="fgb-btn-outline h-8 px-3 text-[9px]">
                        <FileText className="w-3 h-3" /> Resultado
                      </button>
                      <button onClick={() => startEdit(game)} className="fgb-btn-outline h-8 px-3 text-[9px]">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button onClick={() => cancelGame(game.id)} className="fgb-btn-outline h-8 px-3 text-[9px]">
                        <Trash2 className="w-3 h-3" /> Cancelar
                      </button>
                      <MoreVertical className="w-4 h-4 text-[var(--gray)]" />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        type="datetime-local"
                        value={editingDate}
                        onChange={(e) => setEditingDate(e.target.value)}
                        className="h-10 rounded-xl border border-[var(--border)] px-3 text-sm"
                      />
                      <button onClick={() => submitEdit(game.id)} className="fgb-btn-primary h-10 px-4 text-[10px]">
                        Salvar horario
                      </button>
                    </div>
                  )}

                  {isResult && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        type="number"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        className="h-10 w-20 rounded-xl border border-[var(--border)] px-3 text-sm text-center"
                      />
                      <span className="fgb-label text-[var(--gray)]">×</span>
                      <input
                        type="number"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        className="h-10 w-20 rounded-xl border border-[var(--border)] px-3 text-sm text-center"
                      />
                      <button onClick={() => submitResult(game.id)} className="fgb-btn-primary h-10 px-4 text-[10px]">
                        Confirmar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    SCHEDULED: { label: 'Agendado', bg: 'var(--gray-l)', color: 'var(--gray)' },
    FINISHED: { label: 'Encerrado', bg: 'var(--verde-light)', color: 'var(--verde)' },
    CANCELLED: { label: 'Cancelado', bg: 'var(--red-light)', color: 'var(--red)' },
    POSTPONED: { label: 'Adiado', bg: 'var(--yellow-light)', color: 'var(--yellow-dark)' },
  }
  const item = map[status] ?? { label: status, bg: 'var(--gray-l)', color: 'var(--gray)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      padding: '3px 8px',
      background: item.bg, color: item.color
    }}>
      {item.label}
    </span>
  )
}

