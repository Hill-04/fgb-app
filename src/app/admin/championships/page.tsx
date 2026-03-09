"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

type Category = {
  id: string
  name: string
  code: string
  _count?: { registrations: number }
}

type Championship = {
  id: string
  name: string
  year: number
  status: string
  minTeamsPerCategory: number
  categories: Category[]
  registrationCount: number
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
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em Andamento',
  FINISHED: 'Encerrado',
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  REGISTRATION_OPEN: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  SCHEDULED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  FINISHED: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export default function AdminChampionshipsPage() {
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!formYear || isNaN(Number(formYear))) { setFormError('Ano inválido.'); return }
    if (formCategories.length === 0) { setFormError('Selecione ao menos uma categoria.'); return }

    setCreating(true)
    try {
      const res = await fetch('/api/championships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          year: Number(formYear),
          minTeamsPerCategory: Number(formMin) || 3,
          categories: formCategories,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setFormError(data.error || 'Erro ao criar campeonato.')
        return
      }

      // Reset form and close dialog
      setFormName('')
      setFormYear(new Date().getFullYear().toString())
      setFormMin('3')
      setFormCategories([])
      setShowDialog(false)
      await fetchChampionships()
    } catch (err) {
      setFormError('Erro inesperado. Tente novamente.')
    } finally {
      setCreating(false)
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
        await fetchChampionships()
      }
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Campeonatos</h1>
          <p className="text-slate-400">Gerencie os campeonatos da Federação Gaúcha de Basquete.</p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20"
          onClick={() => setShowDialog(true)}
        >
          + Criar Campeonato
        </Button>
      </div>

      {/* Create Championship Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl bg-slate-900 border-white/10 text-white max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl">Criar Novo Campeonato</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-300">Nome do Campeonato</Label>
                    <Input
                      placeholder="Ex: Estadual 2026 — Masculino"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Ano</Label>
                    <Input
                      type="number"
                      value={formYear}
                      onChange={e => setFormYear(e.target.value)}
                      className="bg-slate-950/50 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Mínimo de Equipes por Categoria</Label>
                    <Input
                      type="number"
                      value={formMin}
                      onChange={e => setFormMin(e.target.value)}
                      className="bg-slate-950/50 border-white/10 text-white"
                      min={1}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-300">Categorias</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ALL_CATEGORIES.map(cat => (
                      <div key={cat.code} className="flex items-center space-x-2 bg-slate-950 p-3 rounded-md border border-white/5">
                        <Checkbox
                          id={`form-${cat.code}`}
                          checked={formCategories.includes(cat.code)}
                          onCheckedChange={() => toggleCategory(cat.code)}
                          className="border-white/30 data-[state=checked]:bg-orange-500"
                        />
                        <Label htmlFor={`form-${cat.code}`} className="text-sm cursor-pointer leading-tight">
                          {cat.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-sm text-red-400">{formError}</p>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setShowDialog(false); setFormError('') }}
                    className="text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {creating ? 'Criando...' : 'Criar Campeonato'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Championships List */}
      {loading ? (
        <div className="text-slate-400 py-8 text-center">Carregando campeonatos...</div>
      ) : championships.length === 0 ? (
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="py-12 text-center text-slate-400">
            Nenhum campeonato criado ainda. Clique em "Criar Campeonato" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {championships.map((c) => (
            <Card key={c.id} className="bg-slate-900/50 border-white/10 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{c.name}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${STATUS_STYLES[c.status] || STATUS_STYLES.DRAFT}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-400 flex-wrap">
                      <span>Ano: <span className="text-slate-300">{c.year}</span></span>
                      <span>Mín. equipes/cat: <span className="text-slate-300">{c.minTeamsPerCategory}</span></span>
                      <span>Categorias: <span className="text-slate-300">{c.categories.length}</span></span>
                      <span>Inscrições: <span className="text-orange-400 font-medium">{c.registrationCount}</span></span>
                    </div>
                    {c.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {c.categories.map(cat => (
                          <span key={cat.id} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded">
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {c.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(c.id, 'REGISTRATION_OPEN')}
                        disabled={updatingId === c.id}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                      >
                        {updatingId === c.id ? '...' : 'Abrir Inscrições'}
                      </Button>
                    )}
                    {c.status === 'REGISTRATION_OPEN' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(c.id, 'SCHEDULED')}
                        disabled={updatingId === c.id}
                        variant="outline"
                        className="border-white/20 text-slate-300 hover:bg-white/10 text-xs"
                      >
                        {updatingId === c.id ? '...' : 'Fechar Inscrições'}
                      </Button>
                    )}
                    {c.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(c.id, 'IN_PROGRESS')}
                        disabled={updatingId === c.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        {updatingId === c.id ? '...' : 'Iniciar Campeonato'}
                      </Button>
                    )}
                    {c.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(c.id, 'FINISHED')}
                        disabled={updatingId === c.id}
                        className="bg-green-700 hover:bg-green-800 text-white text-xs"
                      >
                        {updatingId === c.id ? '...' : 'Encerrar'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
