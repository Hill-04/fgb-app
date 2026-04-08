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
    <div className="min-h-screen bg-[var(--gray-l)] flex relative overflow-hidden selection:bg-[var(--verde)] selection:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B734008_1px,transparent_1px),linear-gradient(to_bottom,#1B734008_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--verde)] opacity-[0.03] blur-[120px] rounded-full" />
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[var(--yellow)] opacity-[0.04] blur-[100px] rounded-full" />
      </div>

      <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-center p-6 relative z-10 gap-x-16">
        
        {/* Left Side Content (Desktop) */}
        <div className="hidden lg:flex flex-col max-w-lg mb-12 lg:mb-0">
          <Link href="/" className="flex items-center gap-4 mb-12 group inline-flex w-fit">
            <div className="w-12 h-12 flex items-center justify-center rounded bg-[var(--verde)] shrink-0 shadow-sm relative overflow-hidden">
               <img src="https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png" alt="FGB" className="w-8 h-8 object-contain" />
            </div>
            <div className="leading-none">
              <div className="fgb-display text-sm text-[var(--black)]">Federação Gaúcha</div>
              <div className="fgb-label text-[var(--verde)] mt-1">de Basketball</div>
            </div>
          </Link>

          <h2 className="fgb-display leading-[1.05] text-[var(--black)] mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
            Crie sua<br />
            <span className="verde">Conta.</span>
          </h2>
          
          <p className="fgb-label text-[var(--gray)] max-w-sm mb-10" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14, lineHeight: 1.6 }}>
            Faça parte da nova temporada. Após criar sua conta, você poderá ingressar ou gerenciar sua equipe.
          </p>

          <div className="inline-flex items-center gap-2 border border-[var(--border)] bg-white px-4 py-2 rounded-full w-fit shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--verde)] animate-pulse" />
            <span className="fgb-label text-[var(--black)]">
              Temporada 2026 ativa
            </span>
          </div>
        </div>

        {/* Right Side - Form Card */}
        <div className="w-full max-w-md">
          <div className="fgb-card p-8 md:p-10 relative overflow-hidden">
            
            <div className="mb-8 text-center lg:text-left relative z-10">
               {/* Mobile Logo */}
               <div className="lg:hidden flex justify-center mb-6">
                 <Link href="/" className="w-12 h-12 flex items-center justify-center rounded bg-[var(--verde)] shadow-sm relative overflow-hidden">
                   <img src="https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png" alt="FGB" className="w-8 h-8 object-contain" />
                 </Link>
               </div>
              <h1 className="fgb-display text-2xl md:text-3xl text-[var(--black)] mb-2">
                Criar Conta
              </h1>
              <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                Preencha seus dados para começar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {/* Nome Completo */}
              <div className="space-y-2">
                <Label className="fgb-label text-[var(--gray)]">Nome Completo</Label>
                <Input
                  name="name"
                  placeholder="Ex: João Silva"
                  required
                  className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="fgb-label text-[var(--gray)]">E-mail</Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
                />
              </div>

              {/* Papel/Função */}
              <div className="space-y-2">
                <Label className="fgb-label text-[var(--gray)]">Sua Função</Label>
                <Select value={defaultRole} onValueChange={(value) => value && setDefaultRole(value)}>
                  <SelectTrigger className="bg-white border-[var(--border)] text-[var(--black)] rounded-xl h-11 px-4 focus:ring-1 focus:ring-[var(--verde)] focus:border-[var(--verde)] shadow-sm font-sans [&>span]:line-clamp-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[var(--border)] rounded shadow-lg font-sans text-[var(--black)]">
                    <SelectItem value="AUXILIAR" className="focus:bg-[var(--gray-l)] focus:text-[var(--verde)] cursor-pointer">Auxiliar Técnico</SelectItem>
                    <SelectItem value="PREPARADOR_FISICO" className="focus:bg-[var(--gray-l)] focus:text-[var(--verde)] cursor-pointer">Preparador Físico</SelectItem>
                    <SelectItem value="MEDICO" className="focus:bg-[var(--gray-l)] focus:text-[var(--verde)] cursor-pointer">Médico</SelectItem>
                    <SelectItem value="OUTRO" className="focus:bg-[var(--gray-l)] focus:text-[var(--verde)] cursor-pointer">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>
                  Atribuído por padrão. O Head Coach pode alterar depois.
                </p>
              </div>

              {/* Senhas (Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">Senha</Label>
                  <Input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">Confirmar Senha</Label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full fgb-btn-primary mt-6 h-12"
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-8 text-center relative z-10 pt-6" style={{ borderTop: '0.5px solid var(--border)' }}>
              <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                Já possui conta?{' '}
                <Link href="/login" className="text-[var(--verde)] hover:text-[var(--verde-dark)] transition-colors">
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
