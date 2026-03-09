"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategorySelector } from '@/components/CategorySelector'
import { Section } from '@/components/Section'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sex, setSex] = useState<'masculino' | 'feminino'>('masculino')
  const [categories, setCategories] = useState<string[]>([])
  const [gymAvailability, setGymAvailability] = useState('sabado_domingo')
  const [canHost, setCanHost] = useState(true)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      teamName: formData.get('teamName'),
      city: formData.get('city'),
      responsible: formData.get('responsible'),
      phone: formData.get('phone'),
      sex,
      categories,
      gym: {
        name: formData.get('gymName'),
        address: formData.get('gymAddress'),
        city: formData.get('gymCity'),
        capacity: parseInt(formData.get('gymCapacity') as string),
        availability: gymAvailability,
        canHost,
      }
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        alert(result.error || "Erro no cadastro")
        setLoading(false)
        return
      }

      alert("Equipe cadastrada com sucesso!")
      router.push('/login')
    } catch {
      alert("Erro ao conectar ao servidor.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[--bg-main] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[38%] relative flex-col justify-between p-14 overflow-hidden border-r border-[--border-color]">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[--orange]/10 blur-[120px] rounded-full" />
        </div>

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 gradient-orange flex items-center justify-center rotate-45 shrink-0">
            <span className="font-display font-black text-white text-sm -rotate-45">FGB</span>
          </div>
          <div className="leading-none">
            <div className="font-bold text-sm text-[--text-main] tracking-wider uppercase">Federação Gaúcha</div>
            <div className="text-[11px] text-[--text-dim] tracking-widest uppercase">de Basquete</div>
          </div>
        </Link>

        <div className="relative z-10">
          <h2 className="font-black uppercase text-[--text-main] leading-none tracking-tight mb-6 text-5xl">
            Registre<br />
            sua<br />
            <span className="text-[--orange]">Equipe</span>
          </h2>
          <p className="text-[--text-secondary] text-sm leading-relaxed max-w-xs">
            Crie sua conta para inscrever sua equipe nos campeonatos, gerenciar o ginásio e acompanhar o calendário.
          </p>
        </div>

        <div className="relative z-10 text-xs text-[--text-dim]">
          Já tem conta?{' '}
          <Link href="/login" className="text-[--orange] hover:text-[--orange-hover] transition-colors font-semibold">
            Fazer login
          </Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-start items-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-2xl animate-fade-up">
          <div className="mb-8">
            <h1 className="font-black text-3xl uppercase text-[--text-main] tracking-tight mb-2">
              Cadastro de Equipe
            </h1>
            <p className="text-[--text-secondary] text-sm">
              Preencha todos os dados da sua equipe
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Dados da Equipe */}
            <Section title="Dados da Equipe">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="label-uppercase text-[--text-dim]">Nome da Equipe</Label>
                  <Input
                    name="teamName"
                    placeholder="Ex: Flyboys"
                    required
                    className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase text-[--text-dim]">Cidade</Label>
                  <Input
                    name="city"
                    placeholder="Porto Alegre"
                    required
                    className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="label-uppercase text-[--text-dim]">Responsável</Label>
                  <Input
                    name="responsible"
                    placeholder="Nome completo"
                    required
                    className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase text-[--text-dim]">Telefone</Label>
                  <Input
                    name="phone"
                    placeholder="(51) 99999-9999"
                    required
                    className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="label-uppercase text-[--text-dim]">E-mail</Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="contato@equipe.com.br"
                  required
                  className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                />
              </div>
            </Section>

            {/* Naipe */}
            <Section title="Naipe da Equipe">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSex('masculino')}
                  className={`flex-1 px-6 py-4 rounded-lg border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                    sex === 'masculino'
                      ? 'bg-[--blue-admin]/20 border-[--blue-admin] text-[--blue-light]'
                      : 'bg-[--bg-card] border-[--border-color] text-[--text-secondary]'
                  }`}
                >
                  <span className="text-2xl">♂</span>
                  <span>Masculino</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSex('feminino')}
                  className={`flex-1 px-6 py-4 rounded-lg border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                    sex === 'feminino'
                      ? 'bg-[--pink-female]/20 border-[--pink-female] text-[--pink-female]'
                      : 'bg-[--bg-card] border-[--border-color] text-[--text-secondary]'
                  }`}
                >
                  <span className="text-2xl">♀</span>
                  <span>Feminino</span>
                </button>
              </div>
            </Section>

            {/* Categorias */}
            <Section
              title={`Categorias (${categories.length} selecionadas)`}
              subtitle="Selecione as categorias que sua equipe disputa"
            >
              <CategorySelector selected={categories} onChange={setCategories} />
            </Section>

            {/* Ginásio */}
            <Section title="Ginásio da Equipe">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-uppercase text-[--text-dim]">Nome do Ginásio</Label>
                    <Input
                      name="gymName"
                      placeholder="Ex: Ginásio Municipal"
                      required
                      className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase text-[--text-dim]">Cidade</Label>
                    <Input
                      name="gymCity"
                      placeholder="Porto Alegre"
                      required
                      className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="label-uppercase text-[--text-dim]">Endereço</Label>
                  <Input
                    name="gymAddress"
                    placeholder="Rua, número, bairro"
                    required
                    className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-uppercase text-[--text-dim]">Capacidade</Label>
                    <Input
                      name="gymCapacity"
                      type="number"
                      placeholder="300"
                      required
                      className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase text-[--text-dim]">Disponibilidade</Label>
                    <Select value={gymAvailability} onValueChange={setGymAvailability}>
                      <SelectTrigger className="bg-[--bg-card] border-[--border-color] text-[--text-main]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sabado_domingo">Sábado e Domingo</SelectItem>
                        <SelectItem value="sabado">Apenas Sábado</SelectItem>
                        <SelectItem value="domingo">Apenas Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="canHost"
                    checked={canHost}
                    onChange={(e) => setCanHost(e.target.checked)}
                    className="w-4 h-4 rounded border-[--border-color] text-[--orange]"
                  />
                  <Label htmlFor="canHost" className="text-sm text-[--text-secondary] cursor-pointer">
                    Este ginásio pode sediar jogos de campeonatos
                  </Label>
                </div>
              </div>
            </Section>

            {/* Senha */}
            <Section title="Senha de Acesso">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="label-uppercase text-[--text-dim]">Senha</Label>
                  <Input
                    name="password"
                    type="password"
                    required
                    className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase text-[--text-dim]">Confirmar Senha</Label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    required
                    className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
                  />
                </div>
              </div>
            </Section>

            <Button
              type="submit"
              className="w-full gradient-orange text-white font-bold h-12 shadow-lg"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Equipe'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[--text-dim]">
              Já possui conta?{' '}
              <Link href="/login" className="text-[--orange] hover:text-[--orange-hover] font-semibold">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
