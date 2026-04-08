"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, MapPin, Phone, Building2, Users, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface GymData {
  id?: string
  name: string
  address: string
  city: string
  capacity: number
  availability: string
  canHost: boolean
}

interface TeamData {
  id: string
  name: string
  logoUrl: string | null
  city: string | null
  state: string | null
  phone: string | null
  sex: string | null
  gym: GymData | null
}

export default function TeamProfilePage() {
  const router = useRouter()
  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('RS')
  const [phone, setPhone] = useState('')
  const [sex, setSex] = useState('masculino')

  // Gym state
  const [gymName, setGymName] = useState('')
  const [gymAddress, setGymAddress] = useState('')
  const [gymCity, setGymCity] = useState('')
  const [gymCapacity, setGymCapacity] = useState('')
  const [gymAvailability, setGymAvailability] = useState('')
  const [gymCanHost, setGymCanHost] = useState(true)

  useEffect(() => {
    fetch('/api/team/profile')
      .then((r) => r.json())
      .then((data: TeamData) => {
        setTeam(data)
        setName(data.name ?? '')
        setLogoUrl(data.logoUrl ?? '')
        setCity(data.city ?? '')
        setState(data.state ?? 'RS')
        setPhone(data.phone ?? '')
        setSex(data.sex ?? 'masculino')
        if (data.gym) {
          setGymName(data.gym.name ?? '')
          setGymAddress(data.gym.address ?? '')
          setGymCity(data.gym.city ?? '')
          setGymCapacity(String(data.gym.capacity ?? ''))
          setGymAvailability(data.gym.availability ?? '')
          setGymCanHost(data.gym.canHost ?? true)
        }
      })
      .catch(() => setFeedback({ type: 'error', message: 'Erro ao carregar dados da equipe.' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    const hasGym = gymName.trim() !== ''

    const res = await fetch('/api/team/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        logoUrl: logoUrl || null,
        city,
        state,
        phone,
        sex,
        ...(hasGym && {
          gym: {
            name: gymName,
            address: gymAddress,
            city: gymCity,
            capacity: Number(gymCapacity) || 0,
            availability: gymAvailability,
            canHost: gymCanHost,
          },
        }),
      }),
    })

    const result = await res.json()
    if (!res.ok) {
      setFeedback({ type: 'error', message: result.error ?? 'Erro ao salvar.' })
    } else {
      setTeam(result)
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' })
      router.refresh()
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--verde)]" />
      </div>
    )
  }

  return (
    <div className="space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border)] pb-10">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] mb-4">
            <Link href="/team/dashboard" className="hover:text-[var(--verde)] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--black)]">Perfil da Equipe</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-display font-black text-[var(--black)] tracking-tight leading-tight italic uppercase">
            Perfil da Equipe
          </h1>
          <p className="fgb-label text-[var(--gray)] mt-2" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Edite as informações da sua equipe e ginásio.
          </p>
        </div>

        {/* Current logo preview */}
        {team?.logoUrl && (
          <div className="w-20 h-20 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-center overflow-hidden shadow-sm shrink-0">
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-bold ${
          feedback.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <AlertCircle className="w-5 h-5 shrink-0" />
          }
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-10">
        {/* Section: Dados da Equipe */}
        <section className="fgb-card p-8 space-y-6">
          <div className="flex items-center gap-3 pb-5 border-b border-[var(--border)]">
            <div className="w-9 h-9 rounded-xl bg-[var(--verde)] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="fgb-display text-base text-[var(--black)]">Dados da Equipe</h2>
              <p className="fgb-label text-[var(--gray)] mt-0.5" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                Informações principais da equipe
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Nome da Equipe</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Associação Basquete Porto Alegre"
                className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="fgb-label text-[var(--gray)]">URL do Logotipo</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                type="url"
                className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
              />
              <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>
                Link direto para a imagem do escudo (PNG ou JPG, preferencialmente quadrado).
              </p>
            </div>

            <div className="space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Modalidade</Label>
              <Select value={sex} onValueChange={(v) => v && setSex(v)}>
                <SelectTrigger className="bg-white border-[var(--border)] text-[var(--black)] rounded-xl h-12 px-4 focus:ring-1 focus:ring-[var(--verde)] focus:border-[var(--verde)] shadow-sm font-sans [&>span]:line-clamp-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[var(--border)] rounded-xl shadow-lg font-sans text-[var(--black)]">
                  <SelectItem value="masculino" className="focus:bg-[var(--gray-l)] focus:text-[var(--verde)] cursor-pointer">Masculino</SelectItem>
                  <SelectItem value="feminino" className="focus:bg-[var(--gray-l)] focus:text-[var(--verde)] cursor-pointer">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Telefone / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray)]" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(51) 99999-9999"
                  className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 pl-10 pr-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Cidade</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray)]" />
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Porto Alegre"
                  className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 pl-10 pr-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Estado</Label>
              <Select value={state} onValueChange={(v) => v && setState(v)}>
                <SelectTrigger className="bg-white border-[var(--border)] text-[var(--black)] rounded-xl h-12 px-4 focus:ring-1 focus:ring-[var(--verde)] focus:border-[var(--verde)] shadow-sm font-sans [&>span]:line-clamp-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[var(--border)] rounded-xl shadow-lg font-sans text-[var(--black)]">
                  {['RS','SC','PR','SP','RJ','MG','BA','GO','DF','AM','PA','CE','PE','RN','MT','MS','ES','AL','SE','PI','MA','PB','TO','RO','AC','AP','RR'].map((uf) => (
                    <SelectItem key={uf} value={uf} className="focus:bg-[var(--gray-l)] focus:text-[var(--verde)] cursor-pointer">{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Section: Ginásio */}
        <section className="fgb-card p-8 space-y-6">
          <div className="flex items-center gap-3 pb-5 border-b border-[var(--border)]">
            <div className="w-9 h-9 rounded-xl bg-[var(--amarelo)] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-[var(--black)]" />
            </div>
            <div>
              <h2 className="fgb-display text-base text-[var(--black)]">Ginásio</h2>
              <p className="fgb-label text-[var(--gray)] mt-0.5" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                Informações do ginásio mandante — usado para agendamento de jogos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Nome do Ginásio</Label>
              <Input
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                placeholder="Ex: Ginásio Municipal José Feijó"
                className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Endereço</Label>
              <Input
                value={gymAddress}
                onChange={(e) => setGymAddress(e.target.value)}
                placeholder="Rua, número, bairro"
                className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
              />
            </div>

            <div className="space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Cidade do Ginásio</Label>
              <Input
                value={gymCity}
                onChange={(e) => setGymCity(e.target.value)}
                placeholder="Ex: Porto Alegre"
                className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
              />
            </div>

            <div className="space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Capacidade (pessoas)</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray)]" />
                <Input
                  value={gymCapacity}
                  onChange={(e) => setGymCapacity(e.target.value)}
                  type="number"
                  min={0}
                  placeholder="Ex: 500"
                  className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 pl-10 pr-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Disponibilidade</Label>
              <Input
                value={gymAvailability}
                onChange={(e) => setGymAvailability(e.target.value)}
                placeholder="Ex: Sáb/Dom - manhã e tarde"
                className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
              />
            </div>

            <div className="space-y-2">
              <Label className="fgb-label text-[var(--gray)]">Pode ser sede de jogos?</Label>
              <Select value={gymCanHost ? 'sim' : 'nao'} onValueChange={(v) => setGymCanHost(v === 'sim')}>
                <SelectTrigger className="bg-white border-[var(--border)] text-[var(--black)] rounded-xl h-12 px-4 focus:ring-1 focus:ring-[var(--verde)] focus:border-[var(--verde)] shadow-sm font-sans [&>span]:line-clamp-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[var(--border)] rounded-xl shadow-lg font-sans text-[var(--black)]">
                  <SelectItem value="sim" className="focus:bg-[var(--gray-l)] focus:text-[var(--verde)] cursor-pointer">Sim</SelectItem>
                  <SelectItem value="nao" className="focus:bg-[var(--gray-l)] focus:text-[var(--verde)] cursor-pointer">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Link
            href="/team/dashboard"
            className="h-11 px-6 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--gray-l)] text-[var(--black)] font-bold text-xs flex items-center justify-center transition-all shadow-sm"
          >
            Cancelar
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="h-11 px-8 rounded-xl bg-[var(--verde)] hover:bg-[var(--verde-dark)] text-white font-black uppercase tracking-widest text-xs transition-all shadow-sm disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
