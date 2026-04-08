"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/Badge'
import { Label } from '@/components/ui/label'
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  LayoutGrid, 
  List, 
  Filter,
  Users,
  Clock
} from 'lucide-react'

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
  categories: { id: string, name: string }[]
}

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Agendado', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'FINISHED', label: 'Encerrado', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-200' },
]

export default function TeamMatchesPage() {
  const { data: session } = useSession()
  const teamId = (session?.user as any)?.teamId

  const [games, setGames] = useState<Game[]>([])
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-[var(--black)] uppercase tracking-tight mb-2 italic">Jogos e Resultados</h1>
          <p className="text-[var(--gray)] font-medium uppercase tracking-widest text-[10px]">Agenda completa e histórico de partidas</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-[var(--border)]">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('CARD')}
            className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${viewMode === 'CARD' ? 'bg-[var(--amarelo)] text-[var(--black)]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-2" /> Cards
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('TABLE')}
            className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${viewMode === 'TABLE' ? 'bg-[var(--amarelo)] text-[var(--black)]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="w-3.5 h-3.5 mr-2" /> Tabela
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl border border-[var(--border)] space-y-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] uppercase font-black text-[var(--black)] tracking-[0.2em]">Filtros</span>
          </div>
          <button 
            onClick={() => setOnlyMyTeam(!onlyMyTeam)}
            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${onlyMyTeam ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'}`}
          >
            {onlyMyTeam ? 'Apenas minha equipe' : 'Todas as equipes'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-[var(--gray)] tracking-widest ml-1">Campeonato</Label>
            <select 
              value={selectedChamp} 
              onChange={e => { setSelectedChamp(e.target.value); setSelectedCat('') }}
              className="w-full bg-gray-50 border-[var(--border)] border h-12 rounded-2xl px-4 text-sm text-[var(--black)] focus:outline-none focus:border-orange-300 transition-colors"
            >
              <option value="">Todos os Campeonatos</option>
              {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-[var(--gray)] tracking-widest ml-1">Categoria</Label>
            <select 
              value={selectedCat} 
              onChange={e => setSelectedCat(e.target.value)}
              disabled={!selectedChamp}
              className="w-full bg-gray-50 border-[var(--border)] border h-12 rounded-2xl px-4 text-sm text-[var(--black)] focus:outline-none focus:border-orange-300 transition-colors disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-gray-50 border border-[var(--border)] h-56 animate-pulse rounded-[32px]" />)}
        </div>
      ) : games.length === 0 ? (
        <div className="py-32 text-center bg-gray-50 rounded-[40px] border border-dashed border-gray-300">
          <Calendar className="w-16 h-16 mx-auto mb-6 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-tight italic">Nenhuma partida encontrada</h3>
          <p className="text-[var(--gray)] font-medium max-w-xs mx-auto text-sm">Não há jogos agendados com os filtros atuais.</p>
        </div>
      ) : viewMode === 'CARD' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <Card key={game.id} className="fgb-card bg-white border border-[var(--border)] rounded-[32px] overflow-hidden group hover:border-orange-200 transition-all duration-300 shadow-sm hover:shadow-md">
               <CardHeader className="p-6 pb-2 border-b border-[var(--border)] bg-gray-50">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[9px] uppercase font-black tracking-tight text-orange-600 border-orange-200 bg-orange-50">{game.category.name}</Badge>
                    <Trophy className="w-4 h-4 text-[var(--gray)] opacity-50" />
                  </div>
               </CardHeader>
               <CardContent className="p-8">
                  <div className="flex items-center justify-between gap-6 mb-8 relative">
                     <div className="flex-1 text-center">
                        <div className="text-[9px] font-black uppercase text-[var(--gray)] mb-2 tracking-widest">CASA</div>
                        <div className="font-display font-black text-[var(--black)] text-base uppercase leading-tight min-h-[3rem] flex items-center justify-center italic tracking-tighter">{game.homeTeam.name}</div>
                     </div>
                     
                     <div className="flex flex-col items-center">
                        <div className="text-4xl font-display font-black italic text-[var(--black)] mb-1">
                           {game.status === 'SCHEDULED' ? 'vs' : `${game.homeScore} — ${game.awayScore}`}
                        </div>
                     </div>

                     <div className="flex-1 text-center">
                        <div className="text-[9px] font-black uppercase text-[var(--gray)] mb-2 tracking-widest">FORA</div>
                        <div className="font-display font-black text-[var(--black)] text-base uppercase leading-tight min-h-[3rem] flex items-center justify-center italic tracking-tighter">{game.awayTeam.name}</div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[var(--border)]">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-[var(--gray)] uppercase tracking-widest">Data & Hora</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-800 uppercase">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          {new Date(game.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {new Date(game.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                     </div>
                     <div className="flex flex-col gap-1.5 text-right">
                        <span className="text-[8px] font-black text-[var(--gray)] uppercase tracking-widest">Localização</span>
                        <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-gray-800 uppercase">
                          <span className="truncate max-w-[120px]">{game.location}</span>
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                     </div>
                  </div>
               </CardContent>
               <div className={`py-3 px-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-t border-[var(--border)] ${STATUS_OPTIONS.find(o => o.value === game.status)?.color}`}>
                  {STATUS_OPTIONS.find(o => o.value === game.status)?.label}
               </div>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-[var(--border)]">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Data</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Categoria</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] text-center">Confronto</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {games.map(game => (
                  <tr key={game.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-6">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${STATUS_OPTIONS.find(o => o.value === game.status)?.color}`}>
                        {STATUS_OPTIONS.find(o => o.value === game.status)?.label}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="text-xs font-bold text-gray-800 uppercase">
                        {new Date(game.dateTime).toLocaleDateString('pt-BR')} • {new Date(game.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-[10px] font-black text-[var(--black)] uppercase tracking-tight">{game.category.name}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-6">
                        <span className="text-xs font-black text-gray-800 uppercase flex-1 text-right italic tracking-tighter">{game.homeTeam.name}</span>
                        <span className="text-lg font-display font-black italic text-orange-600">
                          {game.status === 'SCHEDULED' ? 'vs' : `${game.homeScore} - ${game.awayScore}`}
                        </span>
                        <span className="text-xs font-black text-gray-800 uppercase flex-1 italic tracking-tighter">{game.awayTeam.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-[var(--gray)] text-xs font-medium uppercase truncate max-w-[150px]">{game.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
