'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Section } from '@/components/Section'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar, MapPin, Users, FileText, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'

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
  const [error, setError] = useState('')

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [blockedDates, setBlockedDates] = useState<{ date: string; reason: string }[]>([])
  const [observations, setObservations] = useState('')

  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')

  const handleToggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryName))
    } else {
      setSelectedCategories([...selectedCategories, categoryName])
    }
  }

  const handleAddBlockedDate = () => {
    if (!newDate) return
    if (blockedDates.length >= 3) return
    setBlockedDates([...blockedDates, { date: newDate, reason: newReason }])
    setNewDate('')
    setNewReason('')
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
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao realizar inscricao.')
        setLoading(false)
        return
      }

      router.push('/team/dashboard')
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  const sections = [
    { number: 1, title: 'Categorias', icon: Users },
    { number: 2, title: 'Datas Bloqueadas', icon: Calendar },
    { number: 3, title: 'Ginasio', icon: MapPin },
    { number: 4, title: 'Observacoes', icon: FileText },
  ]

  const isSectionComplete = (section: number) => {
    if (section === 1) return selectedCategories.length > 0
    return true
  }

  return (
    <div className="space-y-8">
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
                className={`
                  flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 relative group
                  ${isActive
                    ? 'bg-white/10 border-white/20 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md'
                    : isComplete
                    ? 'bg-white/[0.03] border-green-500/20 text-slate-400 hover:border-green-500/40'
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/[0.04]'
                  }
                `}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${isActive ? 'bg-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.3)] scale-110' : isComplete ? 'bg-green-500/10' : 'bg-white/5'}
                `}>
                  {isComplete && !isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-inherit'}`} />
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-[10px] uppercase font-black tracking-widest opacity-50 mb-0.5">Etapa {section.number}</div>
                  <div className="font-bold text-sm tracking-tight">{section.title}</div>
                </div>

                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                )}
              </button>
              {index < sections.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-700 hidden lg:block" />
              )}
            </div>
          )
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="card-fgb p-4 border-l-4 border-red-500 bg-red-950/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Section 1: Categories */}
      {currentSection === 1 && (
        <Section
          title="1. Selecione as Categorias"
          subtitle="Escolha todas as categorias que sua equipe disputara neste campeonato"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {championship.categories.map(category => {
                const isSelected = selectedCategories.includes(category.name)
                return (
                  <button
                    key={category.id}
                    onClick={() => handleToggleCategory(category.name)}
                    className={`
                      p-6 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden group/cat
                      ${isSelected
                        ? 'bg-[#FF6B00]/10 border-[#FF6B00] shadow-[0_10px_25px_rgba(255,107,0,0.1)]'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6B00]" />
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Users className={`w-5 h-5 ${isSelected ? 'text-[#FF6B00]' : 'text-slate-600'}`} />
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                        ${isSelected ? 'bg-[#FF6B00] border-[#FF6B00] scale-110' : 'border-white/10'}
                      `}>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </div>
                    <h3 className={`font-display font-black text-xl tracking-tight ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {category.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Conferência RS</p>
                  </button>
                )
              })}
            </div>

            {selectedCategories.length === 0 && (
              <div className="card-fgb p-4 border-l-4 border-[--orange]">
                <p className="text-sm text-[--text-secondary]">
                  <span className="text-[--orange] font-semibold">Atencao:</span> Voce precisa selecionar pelo menos uma categoria para continuar.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-8">
              <Button
                onClick={() => setCurrentSection(2)}
                disabled={selectedCategories.length === 0}
                className="bg-[#FF6B00] hover:bg-[#E66000] text-white px-8 h-12 rounded-xl font-bold transition-all shadow-lg hover:shadow-[#FF6B00]/20"
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
          title="2. Datas Indisponiveis"
          subtitle="Informe ate 3 fins de semana em que sua equipe nao pode jogar (opcional)"
        >
          <div className="space-y-6">
            {holidays.length > 0 && (
              <div className="card-fgb p-4">
                <h4 className="font-semibold text-[--text-main] mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[--orange]" />
                  Feriados ja registrados ({holidays.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm text-[--text-secondary]">
                  {holidays.map(holiday => (
                    <div key={holiday.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>{new Date(holiday.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-fgb p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[--text-main]">Data</Label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[--bg-main] border border-[--border] rounded-md text-[--text-main]"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[--text-main]">Motivo (opcional)</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Torneio, Formatura..."
                      value={newReason}
                      onChange={e => setNewReason(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[--bg-main] border border-[--border] rounded-md text-[--text-main]"
                    />
                    <Button
                      onClick={handleAddBlockedDate}
                      disabled={!newDate || blockedDates.length >= 3}
                      variant="secondary"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {blockedDates.length > 0 && (
              <div className="card-fgb divide-y divide-[--border]">
                {blockedDates.map((blocked, index) => (
                  <div key={index} className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-semibold text-[--orange]">{blocked.date}</span>
                      {blocked.reason && <p className="text-sm text-[--text-secondary]">{blocked.reason}</p>}
                    </div>
                    <Button
                      onClick={() => handleRemoveBlockedDate(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button onClick={() => setCurrentSection(1)} variant="outline">Voltar</Button>
              <Button onClick={() => setCurrentSection(3)} className="bg-[--orange] hover:bg-[--orange-hover] text-white">Proxima Secao</Button>
            </div>
          </div>
        </Section>
      )}

      {/* Section 3: Gym */}
      {currentSection === 3 && (
        <Section
          title="3. Informacoes do Ginasio"
          subtitle="Verifique se os dados do local estao corretos"
        >
          <div className="space-y-6">
            {team.gym ? (
              <div className="card-fgb p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-[--text-secondary] text-xs">Nome do Ginasio</Label>
                    <p className="text-lg font-semibold text-[--text-main] mt-1">{team.gym.name}</p>
                  </div>
                  <div>
                    <Label className="text-[--text-secondary] text-xs">Capacidade</Label>
                    <p className="text-lg font-semibold text-[--text-main] mt-1">{team.gym.capacity} pessoas</p>
                  </div>
                  <div>
                    <Label className="text-[--text-secondary] text-xs">Endereco</Label>
                    <p className="text-[--text-main] mt-1">{team.gym.address}</p>
                  </div>
                  <div>
                    <Label className="text-[--text-secondary] text-xs">Cidade</Label>
                    <p className="text-[--text-main] mt-1">{team.gym.city}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-fgb p-6 border-l-4 border-red-500">
                <p className="text-red-400">Sua equipe nao possui um ginasio cadastrado.</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button onClick={() => setCurrentSection(2)} variant="outline">Voltar</Button>
              <Button onClick={() => setCurrentSection(4)} className="bg-[--orange] hover:bg-[--orange-hover] text-white">Proxima Secao</Button>
            </div>
          </div>
        </Section>
      )}

      {/* Section 4: Observations */}
      {currentSection === 4 && (
        <Section
          title="4. Observacoes"
          subtitle="Informacoes adicionais (opcional)"
        >
          <div className="space-y-6">
            <div className="card-fgb p-6">
              <Textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Preferencias de horario, restricoes, etc."
                rows={6}
                className="w-full bg-[--bg-main] border-[--border] text-[--text-main]"
              />
            </div>

            <div className="card-fgb p-6 bg-[--orange]/5">
              <h3 className="font-bold text-[--text-main] mb-4">Resumo da Inscricao</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[--text-secondary]">Equipe:</span>
                  <span className="font-semibold text-[--text-main]">{team.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--text-secondary]">Categorias:</span>
                  <span className="font-semibold text-[--text-main]">{selectedCategories.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--text-secondary]">Datas bloqueadas:</span>
                  <span className="font-semibold text-[--text-main]">{blockedDates.length}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button onClick={() => setCurrentSection(3)} variant="outline">Voltar</Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || selectedCategories.length === 0}
                className="bg-gradient-to-r from-[--orange] to-[--orange-dark] text-white font-bold"
              >
                {loading ? 'Processando...' : 'Confirmar Inscricao'}
              </Button>
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
