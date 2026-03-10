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
            Crie sua<br />
            <span className="text-[--orange]">Conta</span>
          </h2>
          <p className="text-[--text-secondary] text-sm leading-relaxed max-w-xs">
            Após criar sua conta, você poderá criar sua equipe ou solicitar entrada em uma equipe existente.
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
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8">
            <h1 className="font-black text-3xl uppercase text-[--text-main] tracking-tight mb-2">
              Criar Conta
            </h1>
            <p className="text-[--text-secondary] text-sm">
              Preencha seus dados para começar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome Completo */}
            <div className="space-y-2">
              <Label className="label-uppercase text-[--text-dim]">Nome Completo</Label>
              <Input
                name="name"
                placeholder="Ex: João Silva"
                required
                className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="label-uppercase text-[--text-dim]">E-mail</Label>
              <Input
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
              />
            </div>

            {/* Papel/Função */}
            <div className="space-y-2">
              <Label className="label-uppercase text-[--text-dim]">Sua Função</Label>
              <Select value={defaultRole} onValueChange={setDefaultRole}>
                <SelectTrigger className="bg-[--bg-card] border-[--border-color] text-[--text-main]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUXILIAR">Auxiliar Técnico</SelectItem>
                  <SelectItem value="PREPARADOR_FISICO">Preparador Físico</SelectItem>
                  <SelectItem value="MEDICO">Médico</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[--text-dim]">
                Esta será sua função padrão. O Head Coach poderá alterar seu papel após aprovação.
              </p>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label className="label-uppercase text-[--text-dim]">Senha</Label>
              <Input
                name="password"
                type="password"
                required
                minLength={6}
                className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
              />
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label className="label-uppercase text-[--text-dim]">Confirmar Senha</Label>
              <Input
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="bg-[--bg-card] border-[--border-color] text-[--text-main]"
              />
            </div>

            <Button
              type="submit"
              className="w-full gradient-orange text-white font-bold h-12 shadow-lg"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
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
