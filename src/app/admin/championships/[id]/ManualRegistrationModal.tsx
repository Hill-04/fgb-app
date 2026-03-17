'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Loader2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'

type Team = {
  id: string
  name: string
  city: string
}

type Category = {
  id: string
  name: string
}

export function ManualRegistrationModal({ 
  championshipId, 
  categories 
}: { 
  championshipId: string
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    if (open) {
      const fetchTeams = async () => {
        setLoadingTeams(true)
        try {
          const res = await fetch('/api/admin/teams')
          if (res.ok) {
            setTeams(await res.json())
          }
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingTeams(false)
        }
      }
      fetchTeams()
    }
  }, [open])

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.city && t.city.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleCategory = (name: string) => {
    setSelectedCategories(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  const handleRegister = async () => {
    if (!selectedTeamId) return setError('Selecione uma equipe')
    if (selectedCategories.length === 0) return setError('Selecione ao menos uma categoria')
    
    setSubmitLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/championships/${championshipId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          selectedCategories,
          status: 'CONFIRMED' // Admin registra como confirmado
        })
      })

      if (res.ok) {
        setOpen(false)
        router.refresh()
        // Reset state
        setSelectedTeamId('')
        setSelectedCategories([])
        setSearch('')
      } else {
        const data = await res.json()
        setError(data.error || 'Erro ao realizar inscrição')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-orange-600/20 transition-all hover:scale-105 active:scale-95" />}>
        <Plus className="w-5 h-5 mr-2" />
        Inscrição Manual
      </DialogTrigger>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-2xl rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-8 border-b border-white/5">
          <DialogTitle className="text-2xl font-display font-black uppercase tracking-tight">Registro Manual</DialogTitle>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">Inscrever equipe já cadastrada no sistema</p>
        </DialogHeader>
        
        <div className="p-8 space-y-8">
          {/* Step 1: Select Team */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">1. Selecionar Equipe</Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Buscar equipe por nome ou cidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-white/5 border-white/10 pl-11 h-12 rounded-xl focus:border-[#FF6B00] transition-all"
              />
            </div>
            
            <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {loadingTeams ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-slate-500 text-xs font-medium">
                  Nenhuma equipe encontrada
                </div>
              ) : (
                filteredTeams.map(team => (
                  <div 
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedTeamId === team.id ? 'bg-[#FF6B00]/10 border-[#FF6B00]/50 text-[#FF6B00]' : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-400'}`}
                  >
                    <div>
                      <div className="font-bold text-sm uppercase tracking-tight">{team.name}</div>
                      <div className="text-[10px] font-medium opacity-60 uppercase">{team.city || 'Cidade não informada'}</div>
                    </div>
                    {selectedTeamId === team.id && <Check className="w-4 h-4" />}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step 2: Select Categories */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">2. Selecionar Categorias</Label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => toggleCategory(cat.name)}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedCategories.includes(cat.name) ? 'bg-[#FF6B00]/10 border-[#FF6B00]/40 text-[#FF6B00]' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10'}`}
                >
                  <Checkbox 
                    checked={selectedCategories.includes(cat.name)} 
                    onCheckedChange={() => {}} 
                    className="border-white/20 data-[state=checked]:bg-[#FF6B00]" 
                  />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-white/[0.02] border-t border-white/5 sm:justify-end gap-3 rounded-b-3xl">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)}
            className="rounded-xl h-11 px-6 font-bold text-slate-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRegister}
            disabled={submitLoading || !selectedTeamId || selectedCategories.length === 0}
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-orange-600/20 disabled:opacity-50"
          >
            {submitLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Confirmar Inscrição'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
