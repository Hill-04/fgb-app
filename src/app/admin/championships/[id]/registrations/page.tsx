'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/Badge'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Loader2
} from 'lucide-react'

type Registration = {
  id: string
  team: { id: string; name: string }
  categories: { id: string; name: string }[]
  status: string
  createdAt: string
}

type Team = { id: string; name: string }
type Category = { id: string; name: string }

export default function RegistrationsPage() {
  const params = useParams()
  const id = params.id as string

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  
  // Form State
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState('PENDING')
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [regRes, teamRes, catRes] = await Promise.all([
        fetch(`/api/championships/${id}/registrations`),
        fetch('/api/teams'),
        fetch(`/api/championships/${id}/categories`)
      ])
      
      if (regRes.ok) setRegistrations(await regRes.json())
      if (teamRes.ok) setTeams(await teamRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } catch (error) {
      console.error('Error fetching registration data:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!selectedTeam || selectedCategories.length === 0) return
    
    setModalLoading(true)
    try {
      const url = editingId 
        ? `/api/championships/${id}/registrations/${editingId}`
        : `/api/championships/${id}/registrations`
      
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam,
          categoryIds: selectedCategories,
          status: selectedStatus
        })
      })

      if (res.ok) {
        setShowModal(false)
        fetchData()
        resetForm()
      }
    } catch (error) {
      console.error('Error saving registration:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const handleDelete = async (regId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta inscrição?')) return
    
    try {
      const res = await fetch(`/api/championships/${id}/registrations/${regId}`, {
        method: 'DELETE'
      })
      if (res.ok) fetchData()
    } catch (error) {
      console.error('Error deleting registration:', error)
    }
  }

  const resetForm = () => {
    setSelectedTeam('')
    setSelectedCategories([])
    setSelectedStatus('PENDING')
    setEditingId(null)
  }

  const openEdit = (reg: Registration) => {
    setEditingId(reg.id)
    setSelectedTeam(reg.team.id)
    setSelectedCategories(reg.categories.map(c => c.id))
    setSelectedStatus(reg.status)
    setShowModal(true)
  }

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(i => i !== catId) : [...prev, catId]
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <Badge variant="success" size="sm" className="bg-green-500/10 text-green-500 border-green-500/20">CONFIRMADA</Badge>
      case 'PENDING': return <Badge variant="orange" size="sm" className="bg-orange-500/10 text-orange-500 border-orange-500/20">PENDENTE</Badge>
      case 'CANCELED': return <Badge variant="error" size="sm" className="bg-red-500/10 text-red-500 border-red-500/20">CANCELADA</Badge>
      default: return <Badge variant="default" size="sm">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">Inscrições</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Gestão de Equipes e Categorias</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black px-6 h-12 rounded-xl shadow-lg shadow-orange-600/20 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" /> Adicionar Inscrição
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total de Inscrições</p>
          <p className="text-3xl font-black text-white">{registrations.length}</p>
        </div>
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Confirmadas</p>
          <p className="text-3xl font-black text-green-500">{registrations.filter(r => r.status === 'CONFIRMED').length}</p>
        </div>
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pendentes</p>
          <p className="text-3xl font-black text-orange-500">{registrations.filter(r => r.status === 'PENDING').length}</p>
        </div>
      </div>

      {/* Table Card */}
      <Card className="bg-[#0A0A0A] border-white/5 rounded-[32px] overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Buscar por equipe..." 
              className="pl-11 bg-white/[0.03] border-white/10 h-11 rounded-xl text-sm focus:border-[#FF6B00]"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/10 bg-white/[0.03] hover:bg-white/5 rounded-xl h-11 text-[10px] font-black uppercase tracking-widest">
              <Filter className="w-4 h-4 mr-2" /> Filtrar
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-[#FF6B00] animate-spin" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando inscrições...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-16 h-16 text-white/5 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Nenhuma inscrição encontrada</h3>
              <p className="text-xs text-slate-500">Comece adicionando uma equipe ao campeonato.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipe</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Categorias</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widesttext-center">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-white group-hover:text-[#FF6B00] transition-colors">{reg.team.name}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1.5">
                          {reg.categories.map(cat => (
                            <Badge key={cat.id} variant="purple" size="sm" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] font-black">
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {getStatusBadge(reg.status)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEdit(reg)}
                            className="h-9 w-9 rounded-xl hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] text-slate-500 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(reg.id)}
                            className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-slate-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl bg-[#0A0A0A] border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <CardHeader className="p-10 border-b border-white/5">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-display font-black uppercase tracking-tight text-white">
                    {editingId ? 'Editar Inscrição' : 'Nova Inscrição'}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Selecione a equipe e as categorias
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-10 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Equipe Representante</Label>
                <select 
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full h-13 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:border-[#FF6B00] outline-none appearance-none"
                >
                  <option value="" className="bg-[#0A0A0A]">Selecione uma equipe...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0A0A0A]">{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categorias Inscritas</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedCategories.includes(cat.id)
                        ? 'bg-[#FF6B00]/10 border-[#FF6B00]/50 text-[#FF6B00]'
                        : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status da Inscrição</Label>
                <div className="flex gap-2">
                  {['PENDING', 'CONFIRMED', 'CANCELED'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedStatus(s)}
                      className={`flex-1 px-4 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                        selectedStatus === s
                        ? 'bg-[#FF6B00]/10 border-[#FF6B00]/50 text-[#FF6B00]'
                        : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20'
                      }`}
                    >
                      {s === 'PENDING' ? 'Pendente' : s === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-14 font-black uppercase tracking-widest text-slate-500 hover:text-white rounded-2xl"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={modalLoading || !selectedTeam || selectedCategories.length === 0}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-orange-600/20"
                >
                  {modalLoading ? 'Salvando...' : editingId ? 'Salvar Edição' : 'Confirmar Inscrição'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
