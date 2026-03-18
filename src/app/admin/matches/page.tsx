"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Search, 
  Edit3, 
  Trash2, 
  Plus, 
  LayoutGrid, 
  List, 
  Filter,
  Users,
  ChevronRight,
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

type Team = {
  id: string
  name: string
}

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Agendado', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { value: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { value: 'FINISHED', label: 'Encerrado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
]

export default function AdminMatchesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [championships, setChampionships] = useState<Championship[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedChamp, setSelectedChamp] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD')
  
  // Dialog
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Form (for editing score/status)
  const [formHomeScore, setFormHomeScore] = useState('')
  const [formAwayScore, setFormAwayScore] = useState('')
  const [formStatus, setFormStatus] = useState('SCHEDULED')
  const [formDate, setFormDate] = useState('')
  const [formLocation, setFormLocation] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [champRes, teamRes] = await Promise.all([
        fetch('/api/championships'),
        fetch('/api/teams')
      ])
      
      if (champRes.ok) setChampionships(await champRes.json())
      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeams(teamData.teams || [])
      }

      const url = new URL('/api/admin/games', window.location.origin)
      if (selectedChamp) url.searchParams.set('championshipId', selectedChamp)
      if (selectedCat) url.searchParams.set('categoryId', selectedCat)
      if (selectedTeam) url.searchParams.set('teamId', selectedTeam)
      
      const gameRes = await fetch(url.toString())
      if (gameRes.ok) setGames(await gameRes.json())
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedChamp, selectedCat, selectedTeam])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openEditDialog = (g: Game) => {
    setEditingId(g.id)
    setFormHomeScore(g.homeScore?.toString() || '0')
    setFormAwayScore(g.awayScore?.toString() || '0')
    setFormStatus(g.status)
    setFormDate(new Date(g.dateTime).toISOString().slice(0, 16))
    setFormLocation(g.location)
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    try {
      const res = await fetch(`/api/admin/games/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: formHomeScore,
          awayScore: formAwayScore,
          status: formStatus,
          dateTime: formDate,
          location: formLocation
        })
      })
      if (res.ok) {
        setShowDialog(false)
        fetchData()
      }
    } catch (err) {
      alert('Erro ao salvar')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este jogo?')) return
    try {
      const res = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Agenda de Jogos</h1>
          <p className="text-[--text-secondary] font-medium uppercase tracking-widest text-[10px]">Gestão unificada de partidas e resultados</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#111] p-1 rounded-xl border border-white/5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('CARD')}
            className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'CARD' ? 'bg-[#FF6B00] text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-2" /> Cards
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('TABLE')}
            className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'TABLE' ? 'bg-[#FF6B00] text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List className="w-3.5 h-3.5 mr-2" /> Tabela
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-[#FF6B00]" />
          <span className="text-[10px] uppercase font-black text-white tracking-[0.2em]">Filtros Avançados</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Campeonato</Label>
            <select 
              value={selectedChamp} 
              onChange={e => { setSelectedChamp(e.target.value); setSelectedCat('') }}
              className="w-full bg-white/[0.03] border-white/10 border h-12 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-[#FF6B00]/50 transition-colors"
            >
              <option value="" className="bg-[#0A0A0A]">Todos os Campeonatos</option>
              {championships.map(c => <option key={c.id} value={c.id} className="bg-[#0A0A0A]">{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Categoria</Label>
            <select 
              value={selectedCat} 
              onChange={e => setSelectedCat(e.target.value)}
              disabled={!selectedChamp}
              className="w-full bg-white/[0.03] border-white/10 border h-12 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-[#FF6B00]/50 transition-colors disabled:opacity-30"
            >
              <option value="" className="bg-[#0A0A0A]">Todas as Categorias</option>
              {championships.find(c => c.id === selectedChamp)?.categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Filtrar por Equipe</Label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select 
                value={selectedTeam} 
                onChange={e => setSelectedTeam(e.target.value)}
                className="w-full bg-white/[0.03] border-white/10 border h-12 rounded-2xl pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#FF6B00]/50 transition-colors"
              >
                <option value="" className="bg-[#0A0A0A]">Todas as Equipes</option>
                {teams.map(t => <option key={t.id} value={t.id} className="bg-[#0A0A0A]">{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white/5 border border-white/5 h-56 animate-pulse rounded-[32px]" />)}
        </div>
      ) : games.length === 0 ? (
        <div className="py-32 text-center bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
          <Calendar className="w-16 h-16 mx-auto mb-6 text-slate-800" />
          <h3 className="text-xl font-bold text-slate-400 mb-2 uppercase tracking-tight">Nenhuma partida encontrada</h3>
          <p className="text-slate-600 font-medium max-w-xs mx-auto text-sm">Ajuste os filtros acima para encontrar o que procura.</p>
        </div>
      ) : viewMode === 'CARD' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <Card key={game.id} className="bg-[#121212] border-white/5 rounded-[32px] overflow-hidden group hover:border-[#FF6B00]/30 transition-all duration-300 shadow-2xl">
               <CardHeader className="p-6 pb-2 border-b border-white/5 bg-white/[0.01]">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[9px] uppercase font-black tracking-tight text-[#FF6B00] border-[#FF6B00]/20 bg-[#FF6B00]/5">{game.category.name}</Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(game)} className="h-9 w-9 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white"><Edit3 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(game.id)} className="h-9 w-9 rounded-xl hover:bg-red-500/5 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
               </CardHeader>
               <CardContent className="p-8">
                  <div className="flex items-center justify-between gap-6 mb-8 relative">
                     <div className="flex-1 text-center">
                        <div className="text-[9px] font-black uppercase text-slate-600 mb-2 tracking-widest">CASA</div>
                        <div className="font-display font-black text-white text-base uppercase leading-tight min-h-[3rem] flex items-center justify-center">{game.homeTeam.name}</div>
                     </div>
                     
                     <div className="flex flex-col items-center">
                        <div className="text-4xl font-display font-black italic text-white mb-1 drop-shadow-lg">
                           {game.status === 'SCHEDULED' ? 'vs' : `${game.homeScore} — ${game.awayScore}`}
                        </div>
                     </div>

                     <div className="flex-1 text-center">
                        <div className="text-[9px] font-black uppercase text-slate-600 mb-2 tracking-widest">FORA</div>
                        <div className="font-display font-black text-white text-base uppercase leading-tight min-h-[3rem] flex items-center justify-center">{game.awayTeam.name}</div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Data & Hora</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase">
                          <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                          {new Date(game.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {new Date(game.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                     </div>
                     <div className="flex flex-col gap-1.5 text-right">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Localização</span>
                        <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-300 uppercase">
                          <span className="truncate max-w-[120px]">{game.location}</span>
                          <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
                        </div>
                     </div>
                  </div>
               </CardContent>
               <div className={`py-3 px-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-t border-white/5 ${STATUS_OPTIONS.find(o => o.value === game.status)?.color}`}>
                  {STATUS_OPTIONS.find(o => o.value === game.status)?.label}
               </div>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#111] rounded-[32px] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/[0.02] border-b border-white/5">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Confronto</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Local</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {games.map(game => (
                  <tr key={game.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-6">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${STATUS_OPTIONS.find(o => o.value === game.status)?.color}`}>
                        {STATUS_OPTIONS.find(o => o.value === game.status)?.label}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="text-xs font-bold text-slate-300 uppercase">
                        {new Date(game.dateTime).toLocaleDateString('pt-BR')} • {new Date(game.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{game.category.name}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-6">
                        <span className="text-xs font-black text-white uppercase flex-1 text-right">{game.homeTeam.name}</span>
                        <span className="text-lg font-display font-black italic text-[#FF6B00]">
                          {game.status === 'SCHEDULED' ? 'vs' : `${game.homeScore} - ${game.awayScore}`}
                        </span>
                        <span className="text-xs font-black text-white uppercase flex-1">{game.awayTeam.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-slate-400 text-xs font-medium uppercase truncate max-w-[150px]">{game.location}</td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(game)} className="h-8 w-8 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(game.id)} className="h-8 w-8 rounded-lg hover:bg-red-500/5 text-slate-500 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Result Modal */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
           <Card className="w-full max-w-lg bg-[#0A0A0A] border-white/10 text-white rounded-[40px] shadow-2xl overflow-hidden">
              <CardHeader className="p-10 border-b border-white/5 text-center bg-white/[0.01]">
                 <CardTitle className="text-3xl font-display font-black uppercase tracking-tight">Atualizar Partida</CardTitle>
                 <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Lançamento de placar e gerenciamento de status</CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                 <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 flex items-center justify-center gap-8 shadow-inner">
                       <div className="text-center flex-1">
                          <Label className="text-[10px] font-black mb-4 block text-slate-500 tracking-[0.2em]">CASA</Label>
                          <Input 
                            type="number" 
                            value={formHomeScore} 
                            onChange={e => setFormHomeScore(e.target.value)} 
                            className="text-center text-5xl font-display font-black h-24 bg-transparent border-white/10 focus:border-[#FF6B00] rounded-2xl"
                          />
                       </div>
                       <div className="text-2xl font-black text-slate-800 italic transform rotate-12">VS</div>
                       <div className="text-center flex-1">
                          <Label className="text-[10px] font-black mb-4 block text-slate-500 tracking-[0.2em]">FORA</Label>
                          <Input 
                            type="number" 
                            value={formAwayScore} 
                            onChange={e => setFormAwayScore(e.target.value)} 
                            className="text-center text-5xl font-display font-black h-24 bg-transparent border-white/10 focus:border-[#FF6B00] rounded-2xl"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Status Final</Label>
                          <select 
                            value={formStatus} 
                            onChange={e => setFormStatus(e.target.value)}
                            className="w-full bg-white/[0.03] border-white/10 border h-14 rounded-2xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]/50"
                          >
                             {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#0A0A0A]">{o.label}</option>)}
                          </select>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data e Hora</Label>
                          <Input type="datetime-local" value={formDate} onChange={e => setFormDate(e.target.value)} className="bg-white/[0.03] border-white/10 h-14 rounded-2xl px-4 font-bold" />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Local da Partida</Label>
                       <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Ex: Ginásio Municipal" className="bg-white/[0.03] border-white/10 h-14 rounded-2xl px-4 font-bold" />
                    </div>

                    <div className="flex gap-4 pt-4">
                       <Button variant="ghost" type="button" onClick={() => setShowDialog(false)} className="flex-1 h-14 font-black uppercase tracking-widest text-slate-500 hover:text-white rounded-2xl">Cancelar</Button>
                       <Button disabled={submitLoading} className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all">
                          {submitLoading ? 'Processando...' : 'Confirmar Resultado'}
                       </Button>
                    </div>
                 </form>
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  )
}
