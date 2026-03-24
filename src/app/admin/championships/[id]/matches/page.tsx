"use client"

import { use, useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
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
  LayoutGrid,
  List,
  Filter,
  Users,
  Clock,
  ChevronDown,
  X,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { AISchedulingButton } from '../AISchedulingButton'

type Game = {
  id: string
  homeTeam: { name: string; logoUrl?: string }
  awayTeam: { name: string; logoUrl?: string }
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
  isSimulation: boolean
  categories: { id: string, name: string }[]
}

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Agendado', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { value: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { value: 'FINISHED', label: 'Encerrado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
]

export default function AdminMatchesPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-10 text-white flex justify-center mt-20">Carregando painel de jogos...</div>}>
      <AdminMatchesContent params={params} />
    </Suspense>
  )
}

function AdminMatchesContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [games, setGames] = useState<Game[]>([])
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedCat, setSelectedCat] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD')

  // Dialog
  const [showDialog, setShowDialog] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Form
  const [formHomeScore, setFormHomeScore] = useState('')
  const [formAwayScore, setFormAwayScore] = useState('')
  const [formStatus, setFormStatus] = useState('SCHEDULED')
  const [formDate, setFormDate] = useState('')
  const [formLocation, setFormLocation] = useState('')

  // Create Form
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createCategoryId, setCreateCategoryId] = useState('')
  const [createHomeTeamId, setCreateHomeTeamId] = useState('')
  const [createAwayTeamId, setCreateAwayTeamId] = useState('')
  const [createDate, setCreateDate] = useState('')
  const [createLocation, setCreateLocation] = useState('')
  const [createCity, setCreateCity] = useState('')
  const [createPhase, setCreatePhase] = useState('1')
  const [categoryTeams, setCategoryTeams] = useState<{id: string, name: string}[]>([])
  const [createLoading, setCreateLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const champRes = await fetch('/api/championships')
      if (champRes.ok) {
        setChampionships(await champRes.json())
      }

      const url = new URL('/api/admin/games', window.location.origin)
      url.searchParams.set('championshipId', id)
      if (selectedCat) url.searchParams.set('categoryId', selectedCat)

      const gameRes = await fetch(url.toString())
      if (gameRes.ok) setGames(await gameRes.json())
    } catch (err) {
      console.error('Erro ao buscar partidas:', err)
    } finally {
      setLoading(false)
    }
  }, [id, selectedCat])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch teams for the specific category being used in create modal
  useEffect(() => {
    if (!createCategoryId) {
      setCategoryTeams([])
      return
    }

    const fetchTeams = async () => {
      try {
        const res = await fetch(`/api/championships/${id}/categories/${createCategoryId}/teams`)
        if (res.ok) setCategoryTeams(await res.json())
      } catch (err) {
        console.error('Erro ao buscar times da categoria:', err)
      }
    }
    fetchTeams()
  }, [id, createCategoryId])

  const filteredGames = games.filter(g => 
    g.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openEditDialog = (g: Game) => {
    setEditingGame(g)
    setFormHomeScore(g.homeScore?.toString() || '0')
    setFormAwayScore(g.awayScore?.toString() || '0')
    setFormStatus(g.status)
    setFormDate(new Date(g.dateTime).toISOString().slice(0, 16))
    setFormLocation(g.location)
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGame) return
    setSubmitLoading(true)
    try {
      const res = await fetch(`/api/admin/games/${editingGame.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: parseInt(formHomeScore),
          awayScore: parseInt(formAwayScore),
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
      alert('Erro ao salvar resultado e atualizar classificação.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (deleteId: string) => {
    if (!confirm('Excluir esta partida permanentemente?')) return
    try {
      const res = await fetch(`/api/admin/games/${deleteId}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (err) { console.error(err) }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createCategoryId || !createHomeTeamId || !createAwayTeamId || !createDate) {
      alert('Preencha os campos obrigatórios: Categoria, Times e Data.')
      return
    }

    setCreateLoading(true)
    try {
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          championshipId: id,
          categoryId: createCategoryId,
          homeTeamId: createHomeTeamId,
          awayTeamId: createAwayTeamId,
          dateTime: createDate,
          location: createLocation,
          city: createCity,
          phase: parseInt(createPhase)
        })
      })

      if (res.ok) {
        setShowCreateDialog(false)
        resetCreateForm()
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao criar partida.')
      }
    } catch (err) {
      alert('Erro de conexão ao criar partida.')
    } finally {
      setCreateLoading(false)
    }
  }

  const resetCreateForm = () => {
    setCreateCategoryId('')
    setCreateHomeTeamId('')
    setCreateAwayTeamId('')
    setCreateDate('')
    setCreateLocation('')
    setCreateCity('')
    setCreatePhase('1')
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Jogos e Resultados</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Gestão de placares e calendário</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="h-11 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase text-[10px] tracking-widest px-6 rounded-xl shadow-lg shadow-orange-600/20 transition-all border-none"
          >
            <Trophy className="w-3.5 h-3.5 mr-2" /> Novo Jogo
          </Button>
          <div className="flex items-center gap-2 bg-[#111] p-1 rounded-xl border border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('CARD')}
              className={cn(
                "h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'CARD' ? "bg-orange-500 text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-2" /> Cards
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('TABLE')}
              className={cn(
                "h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'TABLE' ? "bg-orange-500 text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >
              <List className="w-3.5 h-3.5 mr-2" /> Tabela
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[32px] space-y-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-orange-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Painel de Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Categoria</Label>
            <div className="relative">
              <select
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value)}
                className="w-full bg-white/[0.03] border-white/10 border h-12 rounded-2xl px-4 text-xs font-bold text-white appearance-none focus:outline-none focus:border-orange-500/50"
              >
                <option value="" className="bg-[#0A0A0A]">Todas as Categorias</option>
                {championships.find(c => c.id === id)?.categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            </div>
          </div>

          <div className="md:col-span-3 space-y-2">
            <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Procurar Equipe</Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <Input
                placeholder="Digite o nome do time..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-12 bg-white/[0.03] border-white/10 rounded-2xl pl-11 text-xs font-bold focus:border-orange-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-60 bg-white/5 border border-white/5 rounded-[32px] animate-pulse" />)}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="py-24 text-center bg-[#0A0A0A] border border-white/5 border-dashed rounded-[32px]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-8 h-8 text-slate-800" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Nenhuma partida encontrada</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">O calendário ainda não foi gerado para este campeonato</p>
          <Link 
            href={`/admin/championships/${id}/organization`} 
            className="inline-flex items-center gap-2 h-11 px-8 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-[#FF6B00]" /> Organizar agora com IA →
          </Link>
        </div>
      ) : viewMode === 'CARD' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredGames.map(game => (
            <div key={game.id} className="bg-[#0A0A0A] border border-white/5 rounded-[32px] overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
              <div className="p-6 pb-2 flex justify-between items-start">
                 <Badge variant="purple" size="sm">{game.category.name}</Badge>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(game)} className="h-8 w-8 hover:bg-white/5"><Edit3 className="w-4 h-4 text-slate-400 group-hover:text-white" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(game.id)} className="h-8 w-8 hover:bg-red-500/5"><Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" /></Button>
                 </div>
              </div>
              <div className="px-8 py-6 flex items-center justify-between gap-6">
                 <div className="flex-1 text-center">
                    <p className="text-sm font-black text-white leading-tight mb-2 uppercase">{game.homeTeam.name}</p>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl mx-auto flex items-center justify-center text-lg font-black text-orange-500">{game.homeTeam.name.charAt(0)}</div>
                 </div>
                 <div className="text-center">
                    <div className="text-3xl font-black text-white tracking-tighter italic">
                       {game.status === 'SCHEDULED' ? 'VS' : `${game.homeScore} — ${game.awayScore}`}
                    </div>
                 </div>
                 <div className="flex-1 text-center">
                    <p className="text-sm font-black text-white leading-tight mb-2 uppercase">{game.awayTeam.name}</p>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl mx-auto flex items-center justify-center text-lg font-black text-orange-500">{game.awayTeam.name.charAt(0)}</div>
                 </div>
              </div>
              <div className="px-8 py-4 bg-white/[0.01] border-t border-white/5 grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">{format(new Date(game.dateTime), "dd MMM • HH:mm", { locale: ptBR })}</span>
                 </div>
                 <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase truncate text-right">{game.location}</span>
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                 </div>
              </div>
              <div className={cn(
                "py-2.5 text-center text-[9px] font-black uppercase tracking-[0.2em]",
                STATUS_OPTIONS.find(o => o.value === game.status)?.color
              )}>
                {STATUS_OPTIONS.find(o => o.value === game.status)?.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-8 py-6">Status</th>
                <th className="px-6 py-6">Datas / Local</th>
                <th className="px-6 py-6 text-center">Confronto</th>
                <th className="px-6 py-6">Categoria</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredGames.map(game => (
                <tr key={game.id} className="hover:bg-white/[0.01] transition-all group">
                  <td className="px-8 py-6">
                    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", STATUS_OPTIONS.find(o => o.value === game.status)?.color)}>
                      {STATUS_OPTIONS.find(o => o.value === game.status)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-xs font-black text-white leading-none mb-1.5 uppercase">{format(new Date(game.dateTime), "eee, dd 'de' MMMM", { locale: ptBR })}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{game.location} • {format(new Date(game.dateTime), "HH:mm")}</p>
                  </td>
                  <td className="px-6 py-6">
                     <div className="flex items-center justify-center gap-6">
                        <span className="text-xs font-black text-white text-right flex-1 uppercase">{game.homeTeam.name}</span>
                        <span className="text-lg font-black text-orange-500 tabular-nums italic">
                           {game.status === 'SCHEDULED' ? 'vs' : `${game.homeScore} - ${game.awayScore}`}
                        </span>
                        <span className="text-xs font-black text-white flex-1 uppercase">{game.awayTeam.name}</span>
                     </div>
                  </td>
                  <td className="px-6 py-6">
                     <Badge variant="outline" size="sm" className="text-blue-400 border-blue-400/20">{game.category.name}</Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" onClick={() => openEditDialog(game)} className="h-8 w-8 hover:bg-white/5"><Edit3 className="w-4 h-4 text-slate-400" /></Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(game.id)} className="h-8 w-8 hover:bg-red-500/5"><Trash2 className="w-4 h-4 text-slate-400" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Match Result Overlay Modal */}
      {showDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
           <div className="w-full max-w-xl bg-[#0F0F0F] border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden">
              <div className="p-10 border-b border-white/5 text-center">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Relatório de Partida</h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{editingGame?.homeTeam.name} vs {editingGame?.awayTeam.name}</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                 <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 flex items-center justify-center gap-8 shadow-inner">
                    <div className="text-center flex-1">
                       <Label className="text-[10px] font-black text-slate-500 block mb-3">CASA (PTS)</Label>
                       <Input 
                        type="number" 
                        value={formHomeScore} 
                        onChange={e => setFormHomeScore(e.target.value)}
                        className="h-20 text-center text-4xl font-black bg-transparent border-white/10 rounded-2xl focus:border-orange-500"
                       />
                    </div>
                    <div className="text-xl font-black text-orange-500/30">VS</div>
                    <div className="text-center flex-1">
                       <Label className="text-[10px] font-black text-slate-500 block mb-3">FORA (PTS)</Label>
                       <Input 
                        type="number" 
                        value={formAwayScore} 
                        onChange={e => setFormAwayScore(e.target.value)}
                        className="h-20 text-center text-4xl font-black bg-transparent border-white/10 rounded-2xl focus:border-orange-500"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-600 uppercase ml-1">Status Final</Label>
                       <select 
                        value={formStatus} 
                        onChange={e => setFormStatus(e.target.value)}
                        className="w-full h-12 bg-white/[0.03] border-white/10 border rounded-2xl px-4 text-xs font-bold text-white focus:outline-none"
                       >
                          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#0A0A0A]">{o.label}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-600 uppercase ml-1">Data / Hora</Label>
                       <Input 
                        type="datetime-local" 
                        value={formDate} 
                        onChange={e => setFormDate(e.target.value)}
                        className="h-12 bg-white/[0.03] border-white/10 rounded-2xl px-4 text-xs font-bold"
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <Button type="button" onClick={() => setShowDialog(false)} variant="ghost" className="flex-1 h-12 font-black uppercase text-xs tracking-widest text-slate-500">Cancelar</Button>
                    <Button disabled={submitLoading} className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-xs tracking-widest rounded-xl">
                       {submitLoading ? "Salvando..." : "Confirmar Placar"}
                    </Button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Create Game Modal */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
           <div className="w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center">
                       <Calendar className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight">Nova Partida Manual</h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Crie um confronto pontual no calendário</p>
                    </div>
                 </div>
                 <button onClick={() => setShowCreateDialog(false)} className="w-8 h-8 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500">
                    <X className="w-4 h-4" />
                 </button>
              </div>
              
              <form onSubmit={handleCreateSubmit} className="p-8 space-y-6 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria *</Label>
                       <select 
                        required
                        value={createCategoryId} 
                        onChange={e => setCreateCategoryId(e.target.value)}
                        className="w-full h-12 bg-white/[0.03] border-white/10 border rounded-2xl px-4 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                       >
                          <option value="" className="bg-[#0A0A0A]">Selecione a Categoria</option>
                          {championships.find(c => c.id === id)?.categories.map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fase (Round)</Label>
                       <Input 
                        type="number"
                        min="1"
                        value={createPhase} 
                        onChange={e => setCreatePhase(e.target.value)}
                        className="h-12 bg-white/[0.03] border-white/10 rounded-2xl px-4 text-xs font-bold"
                       />
                    </div>
                 </div>

                 <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 space-y-6 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                       <div className="space-y-2 text-center">
                          <Label className="text-[10px] font-black text-[#FF6B00] uppercase block">Equipe da Casa *</Label>
                          <select 
                            required
                            disabled={!createCategoryId}
                            value={createHomeTeamId} 
                            onChange={e => setCreateHomeTeamId(e.target.value)}
                            className="w-full h-12 bg-black/40 border-white/10 border rounded-2xl px-4 text-xs font-bold text-white focus:outline-none text-center"
                          >
                             <option value="" className="bg-[#0F0F0F]">Selecione o Time</option>
                             {categoryTeams.map(t => (
                               <option key={t.id} value={t.id} className="bg-[#0F0F0F]" disabled={t.id === createAwayTeamId}>{t.name}</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-2 text-center">
                          <Label className="text-[10px] font-black text-[#FF6B00] uppercase block">Equipe Visitante *</Label>
                          <select 
                            required
                            disabled={!createCategoryId}
                            value={createAwayTeamId} 
                            onChange={e => setCreateAwayTeamId(e.target.value)}
                            className="w-full h-12 bg-black/40 border-white/10 border rounded-2xl px-4 text-xs font-bold text-white focus:outline-none text-center"
                          >
                             <option value="" className="bg-[#0F0F0F]">Selecione o Time</option>
                             {categoryTeams.map(t => (
                               <option key={t.id} value={t.id} className="bg-[#0F0F0F]" disabled={t.id === createHomeTeamId}>{t.name}</option>
                             ))}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data e Hora *</Label>
                       <Input 
                        required
                        type="datetime-local" 
                        value={createDate} 
                        onChange={e => setCreateDate(e.target.value)}
                        className="h-12 bg-white/[0.03] border-white/10 rounded-2xl px-4 text-xs font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cidade</Label>
                       <Input 
                        placeholder="Ex: Porto Alegre"
                        value={createCity} 
                        onChange={e => setCreateCity(e.target.value)}
                        className="h-12 bg-white/[0.03] border-white/10 rounded-2xl px-4 text-xs font-bold"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Local / Ginásio</Label>
                    <Input 
                      placeholder="Ex: Ginásio Tesourinha"
                      value={createLocation} 
                      onChange={e => setCreateLocation(e.target.value)}
                      className="h-12 bg-white/[0.03] border-white/10 rounded-2xl px-4 text-xs font-bold"
                    />
                 </div>

                 <div className="flex gap-4 pt-4 sticky bottom-0 bg-[#0F0F0F] pb-2">
                    <Button type="button" onClick={() => setShowCreateDialog(false)} variant="ghost" className="flex-1 h-12 font-black uppercase text-xs tracking-widest text-slate-500">Cancelar</Button>
                    <Button disabled={createLoading} className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-green-900/10">
                       {createLoading ? "Criando..." : "Agendar Partida"}
                    </Button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}

