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
import { Plus, Search, Loader2, Check, Calendar, MapPin, MessageSquare, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { format, addDays, isWeekend, startOfToday, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Team = {
  id: string
  name: string
  city: string
  gym?: {
    name: string
    address: string
    city: string
  }
}

type Category = {
  id: string
  name: string
}

type BlockedDate = {
  startDate: string
  endDate?: string
  reason?: string
}

type RegistrationData = {
  id?: string
  teamId: string
  selectedCategories: string[]
  canHost: boolean
  gymName?: string
  gymAddress?: string
  gymCity?: string
  gymMapsLink?: string
  blockedDates: BlockedDate[]
  observations?: string
  status?: string
}

export function ManualRegistrationModal({ 
  championshipId, 
  categories,
  startDate,
  endDate,
  initialData,
  trigger
}: { 
  championshipId: string
  categories: Category[]
  startDate?: Date
  endDate?: Date
  initialData?: RegistrationData
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState(initialData?.teamId || '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.selectedCategories || [])
  const [canHost, setCanHost] = useState(initialData?.canHost ?? false)
  const [gymName, setGymName] = useState(initialData?.gymName || '')
  const [gymAddress, setGymAddress] = useState(initialData?.gymAddress || '')
  const [gymCity, setGymCity] = useState(initialData?.gymCity || '')
  const [gymMapsLink, setGymMapsLink] = useState(initialData?.gymMapsLink || '')
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialData?.blockedDates || [])
  const [observations, setObservations] = useState(initialData?.observations || '')
  
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([])
  
  const router = useRouter()
  const isEditing = !!initialData?.id

  // Calculate weekends and holidays in range
  const weekendsInRange = (startDate && endDate) 
    ? eachDayOfInterval({ start: startDate, end: endDate }).filter(date => isWeekend(date))
    : []

  // Group weekends into Saturday-Sunday pairs
  const weekendPairs: { sat: Date; sun: Date }[] = []
  for (let i = 0; i < weekendsInRange.length; i += 2) {
    if (weekendsInRange[i] && weekendsInRange[i+1]) {
      weekendPairs.push({ sat: weekendsInRange[i], sun: weekendsInRange[i+1] })
    } else if (weekendsInRange[i]) {
      // Just in case the interval starts/ends on a weekend
      const d = weekendsInRange[i]
      if (d.getDay() === 6) { // Saturday
        weekendPairs.push({ sat: d, sun: addDays(d, 1) })
      } else { // Sunday
        weekendPairs.push({ sat: addDays(d, -1), sun: d })
      }
    }
  }

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setLoadingTeams(true)
        try {
          // Fetch teams
          const teamsRes = await fetch('/api/admin/teams')
          if (teamsRes.ok) setTeams(await teamsRes.json())
          
          // Fetch holidays
          const holidaysRes = await fetch('/api/admin/holidays')
          if (holidaysRes.ok) setHolidays(await holidaysRes.json())
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingTeams(false)
        }
      }
      fetchData()
    }
  }, [open])

  // Automatically fill gym data when team is selected
  useEffect(() => {
    if (selectedTeamId && !isEditing) {
      const team = teams.find(t => t.id === selectedTeamId)
      if (team?.gym) {
        setGymName(team.gym.name)
        setGymAddress(team.gym.address)
        setGymCity(team.gym.city)
      }
    }
  }, [selectedTeamId, teams, isEditing])

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.city && t.city.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleCategory = (name: string) => {
    setSelectedCategories(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  const isDateBlocked = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd')
    return blockedDates.some(bd => bd.startDate.startsWith(dStr))
  }

  const isHoliday = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd')
    return holidays.find(h => h.date.startsWith(dStr))
  }

  const toggleWeekend = (sat: Date, sun: Date) => {
    const satStr = format(sat, 'yyyy-MM-dd')
    const sunStr = format(sun, 'yyyy-MM-dd')
    
    if (isDateBlocked(sat)) {
      setBlockedDates(prev => prev.filter(bd => !bd.startDate.startsWith(satStr) && !bd.startDate.startsWith(sunStr)))
    } else {
      setBlockedDates(prev => [
        ...prev, 
        { startDate: satStr, reason: 'Indisponibilidade da equipe' },
        { startDate: sunStr, reason: 'Indisponibilidade da equipe' }
      ])
    }
  }

  const handleRegister = async () => {
    if (!selectedTeamId) return setError('Selecione uma equipe')
    if (selectedCategories.length === 0) return setError('Selecione ao menos uma categoria')
    
    setSubmitLoading(true)
    setError('')
    
    try {
      const url = isEditing 
        ? `/api/championships/${championshipId}/registrations/${initialData.id}`
        : `/api/championships/${championshipId}/register`
      
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          selectedCategories,
          status: initialData?.status || 'CONFIRMED',
          canHost,
          gymName,
          gymAddress,
          gymCity,
          gymMapsLink,
          blockedDates,
          observations
        })
      })

      if (res.ok) {
        setOpen(false)
        router.refresh()
        if (!isEditing) {
          setSelectedTeamId('')
          setSelectedCategories([])
          setBlockedDates([])
          setObservations('')
          setSearch('')
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Erro ao processar inscrição')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        (trigger as React.ReactElement) || (
          <Button className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-orange-600/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5 mr-2" />
            Inscrição Manual
          </Button>
        )
      } />
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-4xl max-h-[90vh] rounded-3xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-8 border-b border-white/5 flex-shrink-0">
          <DialogTitle className="text-2xl font-display font-black uppercase tracking-tight">
            {isEditing ? 'Editar Inscrição' : 'Registro Manual'}
          </DialogTitle>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">
            {isEditing ? 'Alterar dados da inscrição da equipe' : 'Inscrever equipe já cadastrada no sistema'}
          </p>
        </DialogHeader>
        
        <div className="p-8 space-y-10 overflow-y-auto flex-grow custom-scrollbar">
          {/* Step 1: Select Team (Only if not editing) */}
          {!isEditing && (
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-white">1</span>
                Selecionar Equipe
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Buscar equipe por nome ou cidade..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-white/5 border-white/10 pl-11 h-12 rounded-xl focus:border-[#FF6B00] transition-all"
                />
              </div>
              
              <div className="max-h-[180px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
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
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column */}
            <div className="space-y-10">
              {/* Step 2: Select Categories */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-white">{isEditing ? '1' : '2'}</span>
                  Categorias
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map(cat => (
                    <div 
                      key={cat.id}
                      onClick={() => toggleCategory(cat.name)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCategories.includes(cat.name) ? 'bg-[#FF6B00]/10 border-[#FF6B00]/40 text-[#FF6B00]' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10'}`}
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

              {/* Gym Hosting Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-[#FF6B00]" />
                    Sede / Ginásio
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pode sediar?</span>
                    <Switch 
                      checked={canHost} 
                      onCheckedChange={setCanHost} 
                      className="data-[state=checked]:bg-[#FF6B00]"
                    />
                  </div>
                </div>

                {canHost && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Input 
                      placeholder="Nome do Ginásio"
                      value={gymName}
                      onChange={e => setGymName(e.target.value)}
                      className="bg-white/5 border-white/10 h-10 rounded-xl text-xs"
                    />
                    <Input 
                      placeholder="Endereço"
                      value={gymAddress}
                      onChange={e => setGymAddress(e.target.value)}
                      className="bg-white/5 border-white/10 h-10 rounded-xl text-xs"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Cidade"
                        value={gymCity}
                        onChange={e => setGymCity(e.target.value)}
                        className="bg-white/5 border-white/10 h-10 rounded-xl text-xs"
                      />
                      <Input 
                        placeholder="Link Google Maps"
                        value={gymMapsLink}
                        onChange={e => setGymMapsLink(e.target.value)}
                        className="bg-white/5 border-white/10 h-10 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-10">
              {/* Blocked Dates Section */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-[#FF6B00]" />
                  Datas Bloqueadas
                </Label>
                
                {weekendPairs.length > 0 ? (
                  <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {weekendPairs.map((weekend, idx) => {
                      const blocked = isDateBlocked(weekend.sat) || isDateBlocked(weekend.sun)
                      const satHoliday = isHoliday(weekend.sat)
                      const sunHoliday = isHoliday(weekend.sun)
                      
                      return (
                        <div 
                          key={idx}
                          onClick={() => !(satHoliday || sunHoliday) && toggleWeekend(weekend.sat, weekend.sun)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between ${blocked ? 'bg-red-500/10 border-red-500/40 text-red-500' : (satHoliday || sunHoliday) ? 'bg-slate-800/50 border-white/5 text-slate-500 cursor-not-allowed opacity-50' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10 cursor-pointer'}`}
                        >
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase">
                              {format(weekend.sat, 'dd/MM')} e {format(weekend.sun, 'dd/MM')}
                            </div>
                            <div className="text-[8px] opacity-60">
                              {satHoliday ? `Feriado: ${satHoliday.name}` : sunHoliday ? `Feriado: ${sunHoliday.name}` : blocked ? 'Bloqueado para jogos' : 'Disponível'}
                            </div>
                          </div>
                          <Checkbox 
                            checked={blocked || !!(satHoliday || sunHoliday)} 
                            disabled={!!(satHoliday || sunHoliday)}
                            onCheckedChange={() => {}}
                            className={`${blocked ? 'border-red-500 data-[state=checked]:bg-red-500' : 'border-white/20'}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
                    <Info className="w-4 h-4 text-slate-600 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-500 uppercase tracking-tight">Defina as datas do campeonato para selecionar bloqueios</p>
                  </div>
                )}
              </div>

              {/* Observations Section */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-[#FF6B00]" />
                  Observações
                </Label>
                <Textarea 
                  placeholder="Informações adicionais sobre esta inscrição..."
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl text-xs min-h-[100px] resize-none focus:border-[#FF6B00] transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-white/[0.02] border-t border-white/5 sm:justify-end gap-3 flex-shrink-0">
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
              isEditing ? 'Salvar Alterações' : 'Confirmar Inscrição'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
