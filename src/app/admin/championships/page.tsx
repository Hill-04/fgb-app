"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Trophy, Calendar, Users, Edit2, Trash2, Plus } from 'lucide-react'

type Category = {
  id: string
  name: string
  code: string
}

type Championship = {
  id: string
  name: string
  year: number
  status: string
  minTeamsPerCat: number
  categories: Category[]
  _count?: { registrations: number }
}

const ALL_CATEGORIES = [
  { code: 'SUB12M', label: 'Sub 12 Masculino' },
  { code: 'SUB12F', label: 'Sub 12 Feminino' },
  { code: 'SUB13M', label: 'Sub 13 Masculino' },
  { code: 'SUB13F', label: 'Sub 13 Feminino' },
  { code: 'SUB15M', label: 'Sub 15 Masculino' },
  { code: 'SUB15F', label: 'Sub 15 Feminino' },
  { code: 'SUB17M', label: 'Sub 17 Masculino' },
  { code: 'SUB17F', label: 'Sub 17 Feminino' },
]

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  REGISTRATION_OPEN: 'Inscrições Abertas',
  REGISTRATION_CLOSED: 'Inscrições Encerradas',
  VALIDATING: 'Validando Dados',
  SCHEDULING: 'Agendamento em Massa',
  REVIEW: 'Revisão Técnica',
  CONFIRMED: 'Tabela Confirmada',
  ONGOING: 'Em Andamento',
  COMPLETED: 'Finalizado',
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  REGISTRATION_OPEN: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  REGISTRATION_CLOSED: 'bg-red-500/10 text-red-400 border-red-500/20',
  SCHEDULING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  CONFIRMED: 'bg-green-500/10 text-green-400 border-green-500/20',
}

export default function AdminChampionshipsPage() {
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString())
  const [formMin, setFormMin] = useState('3')
  const [formCategories, setFormCategories] = useState<string[]>([])
  const [formError, setFormError] = useState('')

  const fetchChampionships = useCallback(async () => {
    try {
      const res = await fetch('/api/championships')
      if (res.ok) {
        const data = await res.json()
        setChampionships(data)
      }
    } catch (err) {
      console.error('Error fetching championships:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChampionships()
  }, [fetchChampionships])

  const toggleCategory = (code: string) => {
    setFormCategories(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const openCreateDialog = () => {
    setEditingId(null)
    setFormName('')
    setFormYear(new Date().getFullYear().toString())
    setFormMin('3')
    setFormCategories([])
    setFormError('')
    setShowDialog(true)
  }

  const openEditDialog = (c: Championship) => {
    setEditingId(c.id)
    setFormName(c.name)
    setFormYear(c.year.toString())
    setFormMin(c.minTeamsPerCat.toString())
    // Map category names back to codes
    setFormCategories(c.categories.map(cat => {
      const match = ALL_CATEGORIES.find(a => a.label === cat.name)
      return match ? match.code : cat.name
    }))
    setFormError('')
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim()) return setFormError('Nome é obrigatório.')
    if (!formYear) return setFormError('Ano é obrigatório.')
    if (formCategories.length === 0) return setFormError('Selecione ao menos uma categoria.')

    setSubmitLoading(true)
    try {
      const url = editingId ? `/api/championships/${editingId}` : '/api/championships'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          year: Number(formYear),
          minTeamsPerCat: Number(formMin),
          categories: formCategories,
        })
      })

      if (res.ok) {
        setShowDialog(false)
        fetchChampionships()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Erro ao salvar campeonato')
      }
    } catch (err) {
      setFormError('Erro de conexão')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará todas as categorias vinculadas.')) return

    try {
      const res = await fetch(`/api/championships/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchChampionships()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch (err) {
      alert('Erro de conexão')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/championships/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchChampionships()
      }
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Campeonatos</h1>
          <p className="text-[--text-secondary] font-medium uppercase tracking-widest text-[10px]">Gestão Geral da Temporada</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-orange-600/20 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Campeonato
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-white/5 rounded-3xl" />)}
        </div>
      ) : championships.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
          <Trophy className="w-16 h-16 text-white/10 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum campeonato ativo</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Crie o primeiro campeonato da temporada para começar a receber inscrições das equipes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {championships.map((c) => (
            <Card key={c.id} className="bg-[#121212] border-white/5 overflow-hidden group hover:border-[#FF6B00]/30 transition-all duration-300 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter leading-none">{c.name}</h3>
                      <Badge className={`px-3 py-1 text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLES[c.status] || STATUS_STYLES.DRAFT}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-[10px] text-[--text-dim] font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#FF6B00]" /> {c.year}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#FF6B00]" /> {c._count?.registrations || 0} Inscrições</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)} className="h-9 w-9 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-9 w-9 rounded-xl hover:bg-red-500/5 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {c.categories.map(cat => (
                    <span key={cat.id} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                      {cat.name}
                    </span>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-3">
                  {c.status === 'DRAFT' && (
                    <Button 
                      onClick={() => handleStatusChange(c.id, 'REGISTRATION_OPEN')}
                      disabled={updatingId === c.id}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold h-11 rounded-xl text-xs uppercase tracking-widest border border-white/10"
                    >
                      Abrir Inscrições
                    </Button>
                  )}
                  {c.status === 'REGISTRATION_OPEN' && (
                    <Button 
                      onClick={() => handleStatusChange(c.id, 'REGISTRATION_CLOSED')}
                      disabled={updatingId === c.id}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 rounded-xl text-xs uppercase tracking-widest"
                    >
                      Encerrar Inscrições
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal / Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl bg-[#0A0A0A] border-white/10 text-white rounded-3xl shadow-2xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-3xl font-display font-black uppercase tracking-tight">
                {editingId ? 'Editar Campeonato' : 'Novo Campeonato'}
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Definição de regras e categorias</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome da Competição</Label>
                    <Input 
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Ex: Copa Gaúcha Masculina"
                      className="bg-white/[0.03] border-white/10 h-12 rounded-xl focus:border-[#FF6B00] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ano da Temporada</Label>
                    <Input 
                      type="number"
                      value={formYear}
                      onChange={e => setFormYear(e.target.value)}
                      className="bg-white/[0.03] border-white/10 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mín. Equipes/Cat</Label>
                    <Input 
                      type="number"
                      value={formMin}
                      onChange={e => setFormMin(e.target.value)}
                      className="bg-white/[0.03] border-white/10 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Categorias Permitidas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ALL_CATEGORIES.map(cat => (
                      <div 
                        key={cat.code}
                        onClick={() => toggleCategory(cat.code)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formCategories.includes(cat.code) ? 'bg-[#FF6B00]/10 border-[#FF6B00]/40 text-[#FF6B00]' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10'}`}
                      >
                        <Checkbox checked={formCategories.includes(cat.code)} onCheckedChange={() => {}} className="border-white/20 data-[state=checked]:bg-[#FF6B00]" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {formError && <p className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-500/10 p-4 rounded-xl border border-red-500/20">{formError}</p>}

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" type="button" onClick={() => setShowDialog(false)} className="flex-1 h-12 font-bold text-slate-400 hover:text-white rounded-xl">Cancelar</Button>
                  <Button disabled={submitLoading} className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02]">
                    {submitLoading ? 'Processando...' : (editingId ? 'Salvar Alterações' : 'Criar Campeonato')}
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

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}
