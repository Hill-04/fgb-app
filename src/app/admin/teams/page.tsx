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
          <h1 className="fgb-display text-4xl text-[var(--black)] leading-none mb-2">Equipes</h1>
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Gestão de Filiados e Clubes</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="fgb-btn-primary px-8 h-12"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Equipe
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray)]" />
          <Input 
            placeholder="Buscar por nome ou cidade..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-[var(--border)] h-11 rounded-xl text-[var(--black)] font-sans shadow-sm focus-visible:ring-1 focus-visible:ring-[var(--verde)]"
          />
        </div>
      </div>

      <div className="fgb-card p-0 overflow-hidden">
        <div className="fgb-table-wrap">
          <table className="fgb-table w-full text-sm text-left">
            <thead className="bg-[var(--gray-l)] fgb-label text-[var(--gray)]">
              <tr>
                <th className="px-8 py-5">Equipe</th>
                <th className="px-8 py-5">Cidade / Estado</th>
                <th className="px-8 py-5">Responsável</th>
                <th className="px-8 py-5">Contato</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-20 animate-pulse fgb-label text-[var(--gray)]">Carregando...</td></tr>
            ) : filteredTeams.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-20 text-[var(--gray)] italic">Nenhuma equipe encontrada.</td></tr>
            ) : (
              filteredTeams.map((team) => {
                const headCoach = team.members[0]?.user
                return (
                  <tr key={team.id} className="hover:bg-[var(--gray-l)] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            <Shield className="w-5 h-5 text-[var(--gray)]" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--black)] tracking-tight font-sans text-xs flex items-center gap-2">
                             {team.name}
                          </div>
                          <span className="fgb-badge fgb-badge-outline mt-1" style={{ fontSize: 9 }}>
                             {team.sex || 'Masculino'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs text-[var(--gray)] flex items-center gap-1.5 font-sans"><MapPin className="w-3 h-3 text-[var(--verde)]" /> {team.city}, {team.state}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs text-[var(--black)] font-bold">{headCoach?.name || '--'}</div>
                      <div className="fgb-label text-[var(--gray)]" style={{ fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>{headCoach?.email || ''}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs text-[var(--gray)] flex items-center gap-1.5 font-sans"><Phone className="w-3 h-3 text-[var(--verde)]" /> {team.phone || '--'}</div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(team)} className="text-[var(--gray)] hover:text-[var(--black)] hover:bg-[var(--gray-l)]">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)} className="text-[var(--gray)] hover:text-[var(--red)] hover:bg-[var(--red)]/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-xl fgb-card overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-[var(--border)] bg-white">
              <h2 className="fgb-display text-3xl text-[var(--black)] tracking-tight">
                {editingId ? 'Editar Equipe' : 'Cadastrar Equipe'}
              </h2>
              <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Dados cadastrais básicos</p>
            </div>
            <div className="p-8 bg-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-6">
                  <div className="space-y-4">
                    <Label className="fgb-label text-[var(--gray)]">Logo</Label>
                    <div className="w-24 h-24 rounded-2xl bg-[var(--gray-l)] border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden relative group/logo">
                      {formLogoUrl ? (
                        <img src={formLogoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="fgb-label text-[var(--gray)]">Nome da Equipe</Label>
                      <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Grêmio Náutico União" className="bg-white border-[var(--border)] text-[var(--black)] shadow-sm h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--verde)]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="fgb-label text-[var(--gray)]">URL da Logomarca (PNG/SVG)</Label>
                      <Input value={formLogoUrl} onChange={e => setFormLogoUrl(e.target.value)} placeholder="https://..." className="bg-white border-[var(--border)] text-[var(--black)] shadow-sm h-11 rounded-xl text-xs focus-visible:ring-1 focus-visible:ring-[var(--verde)]" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="fgb-label text-[var(--gray)]">Cidade</Label>
                    <Input value={formCity} onChange={e => setFormCity(e.target.value)} placeholder="Porto Alegre" className="bg-white border-[var(--border)] text-[var(--black)] shadow-sm h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--verde)]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="fgb-label text-[var(--gray)]">Gênero</Label>
                    <select 
                      value={formSex} 
                      onChange={e => setFormSex(e.target.value)}
                      className="w-full bg-white border border-[var(--border)] h-12 rounded-xl px-3 text-sm text-[var(--black)] focus:outline-none focus:ring-1 focus:ring-[var(--verde)] shadow-sm"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">Telefone / WhatsApp</Label>
                  <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="(51) 99999-9999" className="bg-white border-[var(--border)] text-[var(--black)] shadow-sm h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--verde)]" />
                </div>

                {formError && <p className="fgb-label text-[var(--red)] bg-[var(--red)]/10 p-4 rounded-xl" style={{ textTransform: 'none', letterSpacing: 0 }}>{formError}</p>}

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" type="button" onClick={() => setShowDialog(false)} className="flex-1 h-12 text-[var(--gray)] font-bold hover:bg-[var(--gray-l)] hover:text-[var(--black)]">Cancelar</Button>
                  <Button disabled={submitLoading} className="flex-1 fgb-btn-primary h-12">
                    {submitLoading ? 'Salvando...' : 'Salvar Equipe'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
