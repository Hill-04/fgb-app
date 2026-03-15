"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [defaultRole, setDefaultRole] = useState<string>('AUXILIAR')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      alert("As senhas não coincidem")
      setLoading(false)
      return
    }

    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password,
      defaultRole
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

      alert("Conta criada com sucesso! Faça login para continuar.")
      router.push('/login')
    } catch {
      alert("Erro ao conectar ao servidor.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden selection:bg-orange-500/30">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-600/[0.08] blur-[120px] rounded-full" />
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/[0.05] blur-[100px] rounded-full" />
      </div>

      {/* Header/Logo for mobile */}
      <div className="absolute top-6 left-6 z-20 lg:hidden">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center rounded-[10px] shadow-[0_4px_20px_rgba(234,88,12,0.4)] shrink-0">
            <span className="font-display font-black text-white text-xs tracking-tight">FGB</span>
          </div>
        </Link>
      </div>

      <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-center p-6 relative z-10 gap-x-16">
        
        {/* Left Side Content (Desktop) */}
        <div className="hidden lg:flex flex-col max-w-lg mb-12 lg:mb-0 animate-fade-in">
          <Link href="/" className="flex items-center gap-4 mb-12 group inline-flex w-fit">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center rounded-[14px] shadow-[0_4px_20px_rgba(234,88,12,0.4)] transition-transform duration-300 group-hover:scale-105 shrink-0">
              <span className="font-display font-black text-white text-base tracking-tight">FGB</span>
            </div>
            <div className="leading-none">
              <div className="font-display font-bold text-sm text-white tracking-[0.2em] uppercase">Federação Gaúcha</div>
              <div className="text-xs text-slate-500 tracking-widest uppercase mt-0.5">de Basquete</div>
            </div>
          </Link>

          <h2
            className="font-display font-black leading-[1.05] tracking-tighter text-white mb-6"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            Crie sua<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Conta.</span>
          </h2>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-10 font-medium tracking-wide">
            Faça parte da nova temporada. Após criar sua conta, você poderá ingressar ou gerenciar sua equipe.
          </p>

          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] backdrop-blur-md px-4 py-2 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(234,88,12,0.8)]" />
            <span className="text-[11px] font-bold text-slate-300 tracking-[0.2em] uppercase">
              Temporada 2026 ativa
            </span>
          </div>
        </div>

        {/* Right Side - Glass Form */}
        <div className="w-full max-w-md animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-3xl rounded-[2rem] p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Subtle inner highlight */}
            <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/5 pointer-events-none" />
            
            <div className="mb-8 text-center lg:text-left relative z-10">
              <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight mb-2">
                Criar Conta
              </h1>
              <p className="text-slate-400 text-sm font-medium">
                Preencha seus dados para começar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Nome Completo */}
              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">
                  Nome Completo
                </Label>
                <Input
                  name="name"
                  placeholder="Ex: João Silva"
                  required
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12 px-4 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:bg-white/[0.05] transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">
                  E-mail
                </Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12 px-4 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:bg-white/[0.05] transition-all"
                />
              </div>

              {/* Papel/Função */}
              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">
                  Sua Função
                </Label>
                <Select value={defaultRole} onValueChange={(value) => value && setDefaultRole(value)}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 text-white rounded-xl h-12 px-4 focus:ring-1 focus:ring-orange-500/50 transition-all [&>span]:line-clamp-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-white/10 rounded-xl">
                    <SelectItem value="AUXILIAR" className="focus:bg-white/[0.06] focus:text-white rounded-lg">Auxiliar Técnico</SelectItem>
                    <SelectItem value="PREPARADOR_FISICO" className="focus:bg-white/[0.06] focus:text-white rounded-lg">Preparador Físico</SelectItem>
                    <SelectItem value="MEDICO" className="focus:bg-white/[0.06] focus:text-white rounded-lg">Médico</SelectItem>
                    <SelectItem value="OUTRO" className="focus:bg-white/[0.06] focus:text-white rounded-lg">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-500 ml-1 mt-1 font-medium">
                  Atribuído por padrão. O Head Coach pode alterar depois.
                </p>
              </div>

              {/* Senhas (Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">
                    Senha
                  </Label>
                  <Input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12 px-4 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">
                    Confirmar Senha
                  </Label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12 px-4 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-12 rounded-xl shadow-[0_0_30px_-5px_rgba(234,88,12,0.4)] transition-all hover:shadow-[0_0_40px_-5px_rgba(234,88,12,0.6)] hover:scale-[1.02] mt-6"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Criando...
                  </span>
                ) : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-8 text-center relative z-10">
              <p className="text-sm text-slate-500 font-medium">
                Já possui conta?{' '}
                <Link href="/login" className="text-white hover:text-orange-400 font-bold transition-colors">
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
