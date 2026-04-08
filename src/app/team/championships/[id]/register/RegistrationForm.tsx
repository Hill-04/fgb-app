'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Section } from '@/components/Section'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar, MapPin, Users, FileText, AlertCircle, CheckCircle2, ChevronRight, Info, ExternalLink, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

type Championship = {
  id: string
  name: string
  minTeamsPerCat: number
  categories: {
    id: string
    name: string
  }[]
}

type Team = {
  id: string
  name: string
  city: string
  gym: {
    name: string
    address: string
    city: string
    capacity: number
    availability: string
    canHost: boolean
  } | null
}

type Holiday = {
  id: string
  date: Date
  name: string
  year: number
  reason: string | null
  isFamilyHoliday: boolean
}

type Props = {
  championship: Championship
  team: Team
  holidays: Holiday[]
}

export function RegistrationForm({ championship, team, holidays }: Props) {
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [blockedDates, setBlockedDates] = useState<{ startDate: string; endDate?: string; reason: string }[]>([])
  const [observations, setObservations] = useState('')

  // Gym Hosting State
  const [canHost, setCanHost] = useState(false)
  const [gymName, setGymName] = useState(team.gym?.name || '')
  const [gymAddress, setGymAddress] = useState(team.gym?.address || '')
  const [gymCity, setGymCity] = useState(team.gym?.city || '')
  const [gymMapsLink, setGymMapsLink] = useState('')

  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newReason, setNewReason] = useState('')
  const [isRange, setIsRange] = useState(false)

  const handleToggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryName))
    } else {
      setSelectedCategories([...selectedCategories, categoryName])
    }
  }

  const handleAddBlockedDate = () => {
    if (!newStartDate) return
    if (blockedDates.length >= 3) {
      toast.error('Limite máximo de 3 bloqueios atingido.')
      return
    }
    setBlockedDates([...blockedDates, { 
      startDate: newStartDate, 
      endDate: isRange ? newEndDate : undefined, 
      reason: newReason 
    }])
    setNewStartDate('')
    setNewEndDate('')
    setNewReason('')
    setIsRange(false)
  }

  const handleRemoveBlockedDate = (index: number) => {
    setBlockedDates(blockedDates.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      setError('Selecione pelo menos uma categoria.')
      setCurrentSection(1)
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/championships/${championship.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCategories,
          blockedDates,
          observations,
          canHost,
          gymName,
          gymAddress,
          gymCity,
          gymMapsLink
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao realizar inscrição.')
        setLoading(false)
        return
      }

      // Success!
      setSuccess(true)
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#0B0F1E', '#FFFFFF']
      })

      setTimeout(() => {
        router.push('/team/dashboard')
        router.refresh() // To update dashboard counts
      }, 3000)

    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  const sections = [
    { number: 1, title: 'Categorias', icon: Users },
    { number: 2, title: 'Datas Bloqueadas', icon: Calendar },
    { number: 3, title: 'Sede / Ginásio', icon: MapPin },
    { number: 4, title: 'Resumo', icon: FileText },
  ]

  const isSectionComplete = (section: number) => {
    if (section === 1) return selectedCategories.length > 0
    return true
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500 font-sans">
        <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-black text-[var(--black)] mb-2 uppercase italic">Inscrição Realizada!</h1>
        <p className="text-[var(--gray)] text-center max-w-md font-medium">
          Sua equipe foi inscrita com sucesso no {championship.name}. 
          Aguarde a validação da federação. Redirecionando...
        </p>
        <div className="mt-8 flex gap-3">
          <Badge variant="outline" className="px-4 py-2 text-sm bg-green-50 text-green-700 border border-green-200">
            <PartyPopper className="w-4 h-4 mr-2" />
            Inscrito com Sucesso
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Section Navigator */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-6 scrollbar-hide">
        {sections.map((section, index) => {
          const Icon = section.icon
          const isActive = currentSection === section.number
          const isComplete = isSectionComplete(section.number)

          return (
            <div key={section.number} className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={() => setCurrentSection(section.number)}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 relative group",
                  isActive
                    ? 'bg-white border-orange-300 shadow-md transform -translate-y-1'
                    : isComplete
                    ? 'bg-green-50/50 border-green-200 text-[var(--gray)] hover:border-green-300'
                    : 'bg-[var(--gray-l)] border-[var(--border)] text-[var(--gray)] hover:border-orange-200 hover:bg-gray-50'
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300",
                  isActive ? 'bg-[var(--amarelo)] text-[var(--black)] shadow-sm scale-110' : isComplete ? 'bg-green-100/50 text-green-600' : 'bg-gray-200 text-gray-500'
                )}>
                  {isComplete && !isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-[10px] uppercase font-black tracking-widest text-[var(--gray)] mb-0.5">Etapa {section.number}</div>
                  <div className={cn("font-bold text-sm tracking-tight", isActive ? "text-[var(--black)]" : "")}>{section.title}</div>
                </div>

                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>
              {index < sections.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-300 hidden lg:block" />
              )}
            </div>
          )
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fgb-card p-4 border-l-4 border-red-500 bg-red-50 rounded-r-3xl animate-in shake-in shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm font-bold">{error}</p>
          </div>
        </div>
      )}

      {/* Section 1: Categories */}
      {currentSection === 1 && (
        <Section
          title="1. Selecione as Categorias"
          subtitle="Escolha todas as categorias que sua equipe disputará neste campeonato"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {championship.categories.map(category => {
                const isSelected = selectedCategories.includes(category.name)
                return (
                  <button
                    key={category.id}
                    onClick={() => handleToggleCategory(category.name)}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden group/cat shadow-sm",
                      isSelected
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-white border-[var(--border)] hover:border-orange-200'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", isSelected ? 'bg-orange-100' : 'bg-gray-100')}>
                        <Users className={cn("w-5 h-5", isSelected ? 'text-orange-600' : 'text-gray-400')} />
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                        isSelected ? 'bg-orange-500 border-orange-500 scale-110' : 'border-gray-200'
                      )}>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </div>
                    <h3 className={cn("font-display font-black text-xl tracking-tight uppercase italic", isSelected ? 'text-orange-700' : 'text-[var(--black)]')}>
                      {category.name}
                    </h3>
                    <p className="text-[10px] font-bold text-[var(--gray)] uppercase tracking-widest mt-1">Federação Gaúcha</p>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end pt-8">
              <Button
                onClick={() => setCurrentSection(2)}
                disabled={selectedCategories.length === 0}
                className="bg-[var(--amarelo)] hover:bg-[var(--orange-dark)] text-[var(--black)] px-8 h-12 rounded-xl font-black italic uppercase transition-all shadow-sm hover:scale-105 active:scale-95"
              >
                Próxima Etapa
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </Section>
      )}

      {/* Section 2: Blocked Dates */}
      {currentSection === 2 && (
        <Section
          title="2. Datas e Indisponibilidades"
          subtitle="Informe datas em que sua equipe não pode jogar ou feriados importantes"
        >
          <div className="space-y-6">
            {/* Holidays Filtered */}
            <div className="fgb-card p-5 bg-blue-50 border border-blue-200 rounded-3xl shadow-sm">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Feriados e Datas Importantes
              </h4>
              <p className="text-xs text-blue-700/80 mb-4 font-medium">
                A federação listou os feriados que podem afetar a logística (festas, datas familiares, etc).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {holidays.filter(h => h.isFamilyHoliday || h.reason).map(holiday => (
                  <div key={holiday.id} className="p-3 rounded-xl bg-white border border-blue-100 flex items-start gap-3 shadow-inner">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-blue-600">
                      {new Date(holiday.date).getDate()}/{new Date(holiday.date).getMonth() + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{holiday.name}</p>
                      <p className="text-[10px] text-gray-500 italic mt-0.5 font-medium">{holiday.reason || 'Data familiar/Festiva'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fgb-card p-6 space-y-6 bg-white border border-[var(--border)] rounded-3xl shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[var(--black)] tracking-tight">Adicionar Bloqueio Personalizado</h4>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-[var(--border)]">
                   <button 
                     onClick={() => setIsRange(false)}
                     className={cn("px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all shadow-sm", !isRange ? "bg-[var(--amarelo)] text-[var(--black)]" : "text-gray-500 hover:text-gray-700")}
                   >Único Dia</button>
                   <button 
                     onClick={() => setIsRange(true)}
                     className={cn("px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all shadow-sm", isRange ? "bg-[var(--amarelo)] text-[var(--black)]" : "text-gray-500 hover:text-gray-700")}
                   >Período</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--gray)] uppercase font-black">{isRange ? 'Início' : 'Data'}</Label>
                  <Input
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="bg-white border-[var(--border)] focus:ring-orange-500 text-gray-800"
                  />
                </div>
                {isRange && (
                  <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                    <Label className="text-xs text-[var(--gray)] uppercase font-black">Fim</Label>
                    <Input
                      type="date"
                      value={newEndDate}
                      onChange={e => setNewEndDate(e.target.value)}
                      className="bg-white border-[var(--border)] focus:ring-orange-500 text-gray-800"
                    />
                  </div>
                )}
                <div className={cn("space-y-2", isRange ? "col-span-1" : "col-span-2")}>
                  <Label className="text-xs text-[var(--gray)] uppercase font-black">Motivo do Bloqueio</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Ex: Torneio em outra cidade..."
                      value={newReason}
                      onChange={e => setNewReason(e.target.value)}
                      className="bg-white border-[var(--border)] focus:ring-orange-500 text-gray-800"
                    />
                    <Button
                      onClick={handleAddBlockedDate}
                      disabled={!newStartDate || (isRange && !newEndDate) || blockedDates.length >= 3}
                      className="bg-gray-800 hover:bg-black text-white font-bold"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              {blockedDates.length > 0 && (
                <div className="space-y-2 mt-6">
                  <Label className="text-[10px] text-[var(--gray)] uppercase font-bold">Bloqueios Solicitados ({blockedDates.length}/3)</Label>
                  <div className="divide-y divide-gray-100 border border-[var(--border)] rounded-xl overflow-hidden">
                    {blockedDates.map((blocked, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50">
                        <div className="flex gap-4 items-center">
                          <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
                          <div>
                            <span className="font-bold text-gray-800">
                              {new Date(blocked.startDate).toLocaleDateString('pt-BR')} 
                              {blocked.endDate ? ` até ${new Date(blocked.endDate).toLocaleDateString('pt-BR')}` : ''}
                            </span>
                            {blocked.reason && <p className="text-xs text-[var(--gray)] mt-0.5">{blocked.reason}</p>}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemoveBlockedDate(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button onClick={() => setCurrentSection(1)} variant="outline" className="border-[var(--border)] text-[var(--gray)] hover:text-black font-bold">Voltar</Button>
              <Button onClick={() => setCurrentSection(3)} className="bg-[var(--amarelo)] hover:bg-[var(--orange-dark)] text-[var(--black)] px-8 font-black italic uppercase transition-all shadow-sm">Próxima Etapa</Button>
            </div>
          </div>
        </Section>
      )}

      {/* Section 3: Gym Hosting */}
      {currentSection === 3 && (
        <Section
          title="3. Sede e Localização"
          subtitle="Sua equipe está disposta a sediar rodadas deste campeonato?"
        >
          <div className="space-y-6">
            <div className="fgb-card p-6 space-y-6 bg-white border border-[var(--border)] rounded-3xl shadow-sm">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-[var(--border)] shadow-inner">
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                        canHost ? "bg-green-100 text-green-600 shadow-sm border border-green-200" : "bg-gray-200 text-gray-500"
                      )}>
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-800">Disposição para Sede</h4>
                         <p className="text-xs text-[var(--gray)] font-medium">Aceitamos sediar jogos e temos ginásio disponível.</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setCanHost(!canHost)}
                     className={cn(
                       "w-14 h-7 rounded-full p-1 transition-all duration-300",
                       canHost ? "bg-green-500" : "bg-gray-300"
                     )}
                   >
                     <div className={cn(
                       "w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm",
                       canHost ? "translate-x-7" : "translate-x-0"
                     )} />
                   </button>
                </div>

                {canHost ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                       <Label className="text-xs text-[var(--gray)] uppercase font-black">Nome do Ginásio</Label>
                       <Input 
                         value={gymName}
                         onChange={e => setGymName(e.target.value)}
                         placeholder="Ex: Ginásio Municipal de Ijuí"
                         className="bg-white border-[var(--border)] text-gray-800"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs text-[var(--gray)] uppercase font-black">Cidade</Label>
                       <Input 
                         value={gymCity}
                         onChange={e => setGymCity(e.target.value)}
                         placeholder="Cidade do ginásio"
                         className="bg-white border-[var(--border)] text-gray-800"
                       />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <Label className="text-xs text-[var(--gray)] uppercase font-black">Endereço Completo</Label>
                       <Input 
                         value={gymAddress}
                         onChange={e => setGymAddress(e.target.value)}
                         placeholder="Rua, Número, Bairro..."
                         className="bg-white border-[var(--border)] text-gray-800"
                       />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <Label className="text-xs text-[var(--gray)] uppercase font-black flex items-center justify-between">
                         Link do Google Maps
                         <span className="normal-case font-medium text-[10px] text-blue-600 flex items-center gap-1 cursor-pointer">
                           Como obter? <Info className="w-3 h-3" />
                         </span>
                       </Label>
                       <div className="relative">
                         <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <Input 
                           value={gymMapsLink}
                           onChange={e => setGymMapsLink(e.target.value)}
                           placeholder="https://maps.app.goo.gl/..."
                           className="bg-white border-[var(--border)] pl-10 text-gray-800"
                         />
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 border-2 border-dashed border-gray-300 bg-gray-50 rounded-3xl flex flex-col items-center justify-center text-center opacity-70">
                     <AlertCircle className="w-10 h-10 text-gray-400 mb-3" />
                     <p className="text-sm text-gray-500 font-medium">Sua equipe não será considerada para sediar rodadas.<br/>Isso pode acarretar em mais viagens durante o campeonato.</p>
                  </div>
                )}
            </div>

            <div className="flex justify-between pt-4">
              <Button onClick={() => setCurrentSection(2)} variant="outline" className="border-[var(--border)] text-[var(--gray)] hover:text-black font-bold">Voltar</Button>
              <Button onClick={() => setCurrentSection(4)} className="bg-[var(--amarelo)] hover:bg-[var(--orange-dark)] text-[var(--black)] px-8 font-black italic uppercase transition-all shadow-sm">Próxima Etapa</Button>
            </div>
          </div>
        </Section>
      )}

      {/* Section 4: Observations & Summary */}
      {currentSection === 4 && (
        <Section
          title="4. Finalização"
          subtitle="Revise os dados e confirme sua inscrição"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-4">
                  <div className="fgb-card p-6 space-y-4 bg-white border border-[var(--border)] rounded-3xl shadow-sm">
                    <Label className="text-xs text-[var(--gray)] uppercase font-black">Observações Adicionais</Label>
                    <Textarea
                      value={observations}
                      onChange={e => setObservations(e.target.value)}
                      placeholder="Preferências de horário, restrições específicas de transporte, etc."
                      rows={8}
                      className="w-full bg-white border-[var(--border)] text-gray-800 focus:ring-orange-500"
                    />
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="fgb-card p-6 bg-orange-50 border border-orange-200 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
                    <h3 className="font-display font-black text-xl text-[var(--black)] mb-6 uppercase tracking-tight italic">Resumo FGB</h3>
                    <div className="space-y-4 text-sm relative z-10">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[var(--border)] shadow-sm">
                        <span className="text-[var(--gray)] font-black uppercase text-[10px] tracking-widest">Equipe</span>
                        <span className="font-bold text-gray-800">{team.name}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[var(--border)] shadow-sm">
                        <span className="text-[var(--gray)] font-black uppercase text-[10px] tracking-widest">Categorias</span>
                        <div className="flex gap-1">
                          {selectedCategories.map((c, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] py-0 border-orange-200 text-orange-600 bg-orange-50">{c}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[var(--border)] shadow-sm">
                        <span className="text-[var(--gray)] font-black uppercase text-[10px] tracking-widest">Bloqueios</span>
                        <span className="font-bold text-gray-800">{blockedDates.length} datas</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[var(--border)] shadow-sm">
                        <span className="text-[var(--gray)] font-black uppercase text-[10px] tracking-widest">Sede</span>
                        <span className={cn("font-bold", canHost ? "text-green-600" : "text-gray-500")}>
                          {canHost ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-orange-200/50 relative z-10">
                       <Button
                        onClick={handleSubmit}
                        disabled={loading || selectedCategories.length === 0}
                        className="w-full bg-[var(--amarelo)] hover:bg-[var(--orange-dark)] text-[var(--black)] font-black uppercase italic tracking-tighter text-lg hover:scale-105 transition-all shadow-md h-14"
                      >
                        {loading ? 'Processando...' : 'Confirmar Inscrição'}
                        {!loading && <PartyPopper className="ml-2 w-5 h-5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm flex-shrink-0">
                        <FileText className="w-4 h-4 text-[var(--gray)]" />
                     </div>
                     <p className="text-[10px] text-[var(--gray)] leading-tight font-black uppercase tracking-widest">
                       Ao confirmar, você concorda com os termos da FGB 2026.
                     </p>
                  </div>
               </div>
            </div>

            <div className="flex justify-start pt-4">
              <Button onClick={() => setCurrentSection(3)} variant="outline" className="border-[var(--border)] text-[var(--gray)] hover:text-black font-bold">Voltar</Button>
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
