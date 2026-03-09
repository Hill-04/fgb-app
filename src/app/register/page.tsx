"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

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
    <div className="min-h-screen bg-[#060810] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-14 overflow-hidden border-r border-white/[0.06]">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg
            viewBox="0 0 600 700"
            className="absolute inset-0 w-full h-full opacity-[0.04]"
            fill="none"
            stroke="white"
            strokeWidth="1"
          >
            <circle cx="300" cy="350" r="120" />
            <circle cx="300" cy="350" r="22" />
            <rect x="20" y="20" width="560" height="660" />
            <path d="M 380 20 L 380 470 L 580 470 L 580 20" />
            <ellipse cx="380" cy="350" rx="100" ry="100" strokeDasharray="12 8" />
            <path d="M 580 80 A 380 380 0 0 0 580 620" />
          </svg>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-600/[0.15] blur-[120px] rounded-full" />
          <div className="absolute top-0 left-0 w-60 h-60 bg-orange-500/[0.06] blur-[100px] rounded-full" />
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-orange-600 flex items-center justify-center rotate-45 shrink-0">
            <span className="font-display font-black text-white text-sm -rotate-45 tracking-tight">FGB</span>
          </div>
          <div className="leading-none">
            <div className="font-display font-bold text-sm text-white tracking-[0.18em] uppercase">Federação Gaúcha</div>
            <div className="text-[11px] text-slate-500 tracking-widest uppercase mt-0.5">de Basquete</div>
          </div>
        </Link>

        {/* Main text */}
        <div className="relative z-10">
          <h2
            className="font-display font-black uppercase text-white leading-none tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.8rem, 5vw, 4.2rem)' }}
          >
            Registre<br />
            sua<br />
            <span className="text-orange-500">Equipe</span>
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Crie sua conta para inscrever sua equipe nos campeonatos da temporada, gerenciar o ginásio e acompanhar o calendário oficial.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Inscrição em campeonatos digitalmente',
              'Gestão de categorias e ginásio',
              'Calendário oficial integrado',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-1 h-1 bg-orange-500 rotate-45 shrink-0" />
                <span className="text-xs text-slate-500">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-slate-700">
          Já tem conta?{' '}
          <Link href="/login" className="text-orange-500 hover:text-orange-400 transition-colors font-semibold">
            Fazer login
          </Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 overflow-y-auto">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden mb-8 flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-600 flex items-center justify-center rotate-45 shrink-0">
            <span className="font-display font-black text-white text-xs -rotate-45">FGB</span>
          </div>
          <span className="font-display font-bold text-base text-white tracking-widest uppercase">
            Federação Gaúcha de Basquete
          </span>
        </Link>

        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <h1 className="font-display font-black text-3xl uppercase text-white tracking-tight mb-2">
              Criar Conta
            </h1>
            <p className="text-slate-500 text-sm">
              Preencha os dados da sua equipe para começar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Nome
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Seu nome"
                  required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 rounded-none h-11 focus:border-orange-500/50 focus:ring-0 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Sobrenome
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Sobrenome"
                  required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 rounded-none h-11 focus:border-orange-500/50 focus:ring-0 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="contato@equipe.com.br"
                required
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 rounded-none h-11 focus:border-orange-500/50 focus:ring-0 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamName" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Equipe
                </Label>
                <Input
                  id="teamName"
                  name="teamName"
                  placeholder="Ex: Flyboys"
                  required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 rounded-none h-11 focus:border-orange-500/50 focus:ring-0 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Cidade
                </Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Porto Alegre"
                  required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 rounded-none h-11 focus:border-orange-500/50 focus:ring-0 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Senha
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 rounded-none h-11 focus:border-orange-500/50 focus:ring-0 transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-11 border-0 rounded-none shadow-[0_0_40px_-8px_rgba(234,88,12,0.5)] transition-all hover:shadow-[0_0_50px_-8px_rgba(234,88,12,0.7)] mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Registrando...
                </span>
              ) : 'Registrar Equipe'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Já possui conta?{' '}
              <Link href="/login" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
                Fazer login
              </Link>
            </p>
          </div>

          <p className="mt-8 text-center text-[10px] text-slate-700 leading-relaxed">
            Ao se registrar, você concorda com os Termos de Serviço e Política de Privacidade da Federação Gaúcha de Basquete.
          </p>
        </div>
      </div>
    </div>
  )
}
