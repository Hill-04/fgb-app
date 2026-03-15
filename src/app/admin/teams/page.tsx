"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Plus, Edit2, Trash2, Search, MapPin, Phone, Shield } from 'lucide-react'
import { Badge } from '@/components/Badge'

type Team = {
  id: string
  name: string
  logoUrl: string | null
  city: string | null
  state: string | null
  phone: string | null
  sex: string | null
  members: {
    user: { name: string, email: string }
  }[]
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formLogoUrl, setFormLogoUrl] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formState, setFormState] = useState('RS')
  const [formSex, setFormSex] = useState('masculino')
  const [formPhone, setFormPhone] = useState('')
  const [formError, setFormError] = useState('')

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/teams')
      if (res.ok) {
        const data = await res.json()
        setTeams(data)
      }
    } catch (err) {
      console.error('Error fetching teams:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreateDialog = () => {
    setEditingId(null)
    setFormName('')
    setFormLogoUrl('')
    setFormCity('')
    setFormState('RS')
    setFormSex('masculino')
    setFormPhone('')
    setFormError('')
    setShowDialog(true)
  }

  const openEditDialog = (t: Team) => {
    setEditingId(t.id)
    setFormName(t.name)
    setFormLogoUrl(t.logoUrl || '')
    setFormCity(t.city || '')
    setFormState(t.state || 'RS')
    setFormSex(t.sex || 'masculino')
    setFormPhone(t.phone || '')
    setFormError('')
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim()) return setFormError('Nome é obrigatório.')

    setSubmitLoading(true)
    try {
      const url = editingId ? `/api/admin/teams/${editingId}` : '/api/admin/teams'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          logoUrl: formLogoUrl.trim(),
          city: formCity,
          state: formState,
          phone: formPhone,
          sex: formSex
        })
      })

      if (res.ok) {
        setShowDialog(false)
        fetchTeams()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Erro ao salvar equipe')
      }
    } catch (err) {
      setFormError('Erro de conexão')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta equipe?')) return

    try {
      const res = await fetch(`/api/admin/teams/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchTeams()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch (error) {
      alert('Erro de conexão')
    }
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Equipes</h1>
          <p className="text-[--text-secondary] font-medium uppercase tracking-widest text-[10px]">Gestão de Filiados e Clubes</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 h-12 rounded-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Equipe
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar por nome ou cidade..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#111] border-white/5 h-11 rounded-xl text-white"
          />
        </div>
      </div>

      <Card className="bg-[#121212] border-white/5 overflow-hidden rounded-3xl">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-14">Equipe</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-14">Cidade / Estado</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-14">Responsável</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-14">Contato</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-14 text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 animate-pulse text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando...</TableCell></TableRow>
            ) : filteredTeams.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-500 italic">Nenhuma equipe encontrada.</TableCell></TableRow>
            ) : (
              filteredTeams.map((team) => {
                const headCoach = team.members[0]?.user
                return (
                  <TableRow key={team.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            <Shield className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white uppercase tracking-tight">{team.name}</div>
                          <Badge variant="outline" className="text-[9px] mt-1 text-slate-500 border-white/5 uppercase">
                            {team.sex || 'Masculino'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-300 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#FF6B00]" /> {team.city}, {team.state}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-white font-medium">{headCoach?.name || '--'}</div>
                      <div className="text-[10px] text-slate-500">{headCoach?.email || ''}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-300 flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#FF6B00]" /> {team.phone || '--'}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(team)} className="h-9 w-9 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)} className="h-9 w-9 rounded-xl hover:bg-red-500/5 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl bg-[#0A0A0A] border-white/10 text-white rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-3xl font-display font-black uppercase tracking-tight">
                {editingId ? 'Editar Equipe' : 'Cadastrar Equipe'}
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Dados cadastrais básicos</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Logo</Label>
                    <div className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative group/logo">
                      {formLogoUrl ? (
                        <img src={formLogoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-8 h-8 text-slate-700" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome da Equipe</Label>
                      <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Grêmio Náutico União" className="bg-white/[0.03] border-white/10 h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">URL da Logomarca (PNG/SVG)</Label>
                      <Input value={formLogoUrl} onChange={e => setFormLogoUrl(e.target.value)} placeholder="https://..." className="bg-white/[0.03] border-white/10 h-11 rounded-xl text-xs" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cidade</Label>
                    <Input value={formCity} onChange={e => setFormCity(e.target.value)} placeholder="Porto Alegre" className="bg-white/[0.03] border-white/10 h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gênero</Label>
                    <select 
                      value={formSex} 
                      onChange={e => setFormSex(e.target.value)}
                      className="w-full bg-white/[0.03] border-white/10 border h-12 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-[#FF6B00]"
                    >
                      <option value="masculino" className="bg-[#0A0A0A]">Masculino</option>
                      <option value="feminino" className="bg-[#0A0A0A]">Feminino</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Telefone / WhatsApp</Label>
                  <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="(51) 99999-9999" className="bg-white/[0.03] border-white/10 h-12 rounded-xl" />
                </div>

                {formError && <p className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-500/10 p-4 rounded-xl">{formError}</p>}

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" type="button" onClick={() => setShowDialog(false)} className="flex-1 h-12 font-bold text-slate-400 hover:text-white">Cancelar</Button>
                  <Button disabled={submitLoading} className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-12 rounded-xl">
                    {submitLoading ? 'Salvando...' : 'Salvar Equipe'}
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
