"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Calendar, MapPin, Edit2, Shield, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/Badge'
import type { GameWithTeams, GameStatus } from '@/types/database'

export default function AdminJogosPage() {
  const [games, setGames] = useState<GameWithTeams[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/jogos')
      if (res.ok) {
        const data = await res.json()
        setGames(data)
      }
    } catch (err) {
      console.error('Erro ao buscar jogos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  const filteredGames = games.filter(game => {
    const matchesSearch = 
      game.home_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.away_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.venue?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || game.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: GameStatus) => {
    switch (status) {
      case 'scheduled': return <Badge variant="info">Agendado</Badge>
      case 'live': return <Badge variant="orange" withDot>Ao Vivo</Badge>
      case 'finished': return <Badge variant="success">Finalizado</Badge>
      case 'cancelled': return <Badge variant="error">Cancelado</Badge>
      default: return <Badge variant="default">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="fgb-display text-4xl text-[var(--black)] leading-none mb-2">Jogos</h1>
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Gestão de Temporada e Calendário</p>
        </div>
        <Link href="/admin/jogos/novo">
          <Button className="fgb-btn-primary px-8 h-12">
            <Plus className="w-5 h-5 mr-2" />
            Novo Jogo
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray)]" />
          <Input 
            placeholder="Buscar por equipe ou local..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-[var(--border)] h-11 rounded-xl text-[var(--black)] font-sans shadow-sm focus-visible:ring-1 focus-visible:ring-[var(--verde)]"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-[var(--gray)] shrink-0" />
          {[
            { id: 'all', label: 'Todos' },
            { id: 'scheduled', label: 'Agendados' },
            { id: 'live', label: 'Ao Vivo' },
            { id: 'finished', label: 'Finalizados' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterStatus(opt.id)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterStatus === opt.id 
                  ? 'bg-[var(--verde)] text-white shadow-md' 
                  : 'bg-white text-[var(--gray)] border border-[var(--border)] hover:border-[var(--verde)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fgb-card p-0 overflow-hidden">
        <div className="fgb-table-wrap">
          <table className="fgb-table w-full text-sm text-left">
            <thead className="bg-[var(--gray-l)] fgb-label text-[var(--gray)]">
              <tr>
                <th className="px-8 py-5">Confronto</th>
                <th className="px-8 py-5">Data / Hora</th>
                <th className="px-8 py-5">Local / Rodada</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-20 animate-pulse fgb-label text-[var(--gray)]">Carregando...</td></tr>
            ) : filteredGames.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-20 text-[var(--gray)] italic">Nenhum jogo encontrado.</td></tr>
            ) : (
              filteredGames.map((game) => (
                <tr key={game.id} className="hover:bg-[var(--gray-l)] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end w-[40%]">
                        <span className="font-bold text-[var(--black)] text-xs truncate w-full text-right">{game.home_team?.short_name || game.home_team?.name}</span>
                      </div>
                      <div className="flex items-center justify-center bg-[var(--gray-l)] px-3 py-1 rounded font-black text-[10px] text-[var(--black)] border border-[var(--border)] min-w-[50px]">
                        {game.home_score !== null ? game.home_score : '-'} x {game.away_score !== null ? game.away_score : '-'}
                      </div>
                      <div className="flex flex-col items-start w-[40%]">
                        <span className="font-bold text-[var(--black)] text-xs truncate w-full">{game.away_team?.short_name || game.away_team?.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs text-[var(--black)] font-bold font-sans">
                      {new Date(game.scheduled_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-[10px] text-[var(--gray)] font-sans">
                      {new Date(game.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs text-[var(--gray)] flex items-center gap-1.5 font-sans">
                      <MapPin className="w-3 h-3 text-[var(--verde)]" /> {game.venue || 'A definir'}
                    </div>
                    {game.round && (
                      <div className="fgb-label text-[var(--verde)] mt-1" style={{ fontSize: 9 }}>Rodada {game.round}</div>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    {getStatusBadge(game.status)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" disabled className="text-[var(--gray)]">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
