"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trophy, Calendar, MapPin, Search, Edit3, Trash2, Plus, ArrowRight } from 'lucide-react'

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
  { value: 'SCHEDULED', label: 'Agendado', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { value: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { value: 'FINISHED', label: 'Encerrado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
]

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChamp, setSelectedChamp] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  
  // Dialog
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Form
  const [formHomeScore, setFormHomeScore] = useState('')
  const [formAwayScore, setFormAwayScore] = useState('')
  const [formStatus, setFormStatus] = useState('SCHEDULED')
  const [formDate, setFormDate] = useState('')
  const [formLocation, setFormLocation] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const champRes = await fetch('/api/championships')
      if (champRes.ok) setChampionships(await champRes.json())

      const url = new URL('/api/admin/games', window.location.origin)
      if (selectedChamp) url.searchParams.set('championshipId', selectedChamp)
      if (selectedCat) url.searchParams.set('categoryId', selectedCat)
      
      const gameRes = await fetch(url.toString())
      if (gameRes.ok) setGames(await gameRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedChamp, selectedCat])

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
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Jogos e Resultados</h1>
          <p className="text-[--text-secondary] font-medium uppercase tracking-widest text-[10px]">Gestão de Confrontos e Placar em Tempo Real</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end bg-[#111] p-6 rounded-2xl border border-white/5">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Campeonato</Label>
          <select 
            value={selectedChamp} 
            onChange={e => { setSelectedChamp(e.target.value); setSelectedCat('') }}
            className="w-full bg-white/[0.03] border-white/10 border h-11 rounded-xl px-3 text-sm text-white focus:outline-none"
          >
            <option value="" className="bg-[#0A0A0A]">Todos os Campeonatos</option>
            {championships.map(c => <option key={c.id} value={c.id} className="bg-[#0A0A0A]">{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Categoria</Label>
          <select 
            value={selectedCat} 
            onChange={e => setSelectedCat(e.target.value)}
            disabled={!selectedChamp}
            className="w-full bg-white/[0.03] border-white/10 border h-11 rounded-xl px-3 text-sm text-white focus:outline-none disabled:opacity-50"
          >
            <option value="" className="bg-[#0A0A0A]">Todas as Categorias</option>
            {championships.find(c => c.id === selectedChamp)?.categories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <Card key={i} className="bg-white/5 border-none h-48 animate-pulse rounded-3xl" />)
        ) : games.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-50">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-500 uppercase font-black tracking-widest text-xs">Nenhum jogo encontrado para este filtro.</p>
          </div>
        ) : games.map(game => (
          <Card key={game.id} className="bg-[#121212] border-white/5 rounded-3xl overflow-hidden group hover:border-[#FF6B00]/30 transition-all duration-300">
             <CardHeader className="p-6 pb-2 border-b border-white/5">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-[8px] uppercase tracking-tighter opacity-70">{game.category.name}</Badge>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(game)} className="h-8 w-8 hover:bg-white/5 text-slate-500 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(game.id)} className="h-8 w-8 hover:bg-red-500/5 text-slate-500 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
             </CardHeader>
             <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                   <div className="flex-1 text-center">
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-2 truncate">CASA</div>
                      <div className="font-display font-black text-white text-sm uppercase leading-none h-8 flex items-center justify-center">{game.homeTeam.name}</div>
                   </div>
                   <div className="text-3xl font-display font-black italic text-[#FF6B00]">
                      {game.status === 'SCHEDULED' ? 'vs' : `${game.homeScore} - ${game.awayScore}`}
                   </div>
                   <div className="flex-1 text-center">
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-2 truncate">FORA</div>
                      <div className="font-display font-black text-white text-sm uppercase leading-none h-8 flex items-center justify-center">{game.awayTeam.name}</div>
                   </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t border-white/5">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
                      {new Date(game.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span className="truncate">{game.location}</span>
                   </div>
                </div>
             </CardContent>
             <div className={`py-2 px-6 text-center text-[9px] font-black uppercase tracking-widest border-t border-white/5 ${STATUS_OPTIONS.find(o => o.value === game.status)?.color}`}>
                {STATUS_OPTIONS.find(o => o.value === game.status)?.label}
             </div>
          </Card>
        ))}
      </div>

      {/* Edit Result Modal */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
           <Card className="w-full max-w-lg bg-[#0A0A0A] border-white/10 text-white rounded-3xl shadow-2xl overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5 text-center">
                 <CardTitle className="text-2xl font-display font-black uppercase tracking-tight">Atualizar Partida</CardTitle>
                 <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Lançamento de placar e horários</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center justify-center gap-6">
                       <div className="text-center flex-1">
                          <Label className="text-[9px] font-black mb-2 block text-slate-500">SCORE CASA</Label>
                          <Input 
                            type="number" 
                            value={formHomeScore} 
                            onChange={e => setFormHomeScore(e.target.value)} 
                            className="text-center text-4xl font-display font-black h-20 bg-transparent border-white/10 focus:border-[#FF6B00]"
                          />
                       </div>
                       <div className="text-2xl font-black text-slate-700 italic">VS</div>
                       <div className="text-center flex-1">
                          <Label className="text-[9px] font-black mb-2 block text-slate-500">SCORE FORA</Label>
                          <Input 
                            type="number" 
                            value={formAwayScore} 
                            onChange={e => setFormAwayScore(e.target.value)} 
                            className="text-center text-4xl font-display font-black h-20 bg-transparent border-white/10 focus:border-[#FF6B00]"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</Label>
                          <select 
                            value={formStatus} 
                            onChange={e => setFormStatus(e.target.value)}
                            className="w-full bg-white/[0.03] border-white/10 border h-12 rounded-xl px-3 text-sm text-white focus:outline-none"
                          >
                             {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#0A0A0A]">{o.label}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data e Hora</Label>
                          <Input type="datetime-local" value={formDate} onChange={e => setFormDate(e.target.value)} className="bg-white/[0.03] border-white/10 h-12 rounded-xl" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Local (Ginásio)</Label>
                       <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} className="bg-white/[0.03] border-white/10 h-12 rounded-xl" />
                    </div>

                    <div className="flex gap-4 pt-4">
                       <Button variant="ghost" type="button" onClick={() => setShowDialog(false)} className="flex-1 font-bold text-slate-400 hover:text-white">Cancelar</Button>
                       <Button disabled={submitLoading} className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-12 rounded-xl">
                          {submitLoading ? 'Salvando...' : 'Atualizar Jogo'}
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
