"use client"

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false
    })
    if (result?.error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    // Buscar sessão para verificar se usuário tem equipe
    const response = await fetch('/api/auth/session')
    const session = await response.json()

    // Redirecionar baseado em acesso
    if (session?.user?.isAdmin) {
      router.push('/admin/dashboard')
    } else if (session?.user?.teamId) {
      router.push('/team/dashboard')
    } else {
      router.push('/team/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--gray-l)] flex relative overflow-hidden selection:bg-[var(--verde)] selection:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B734008_1px,transparent_1px),linear-gradient(to_bottom,#1B734008_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--verde)] opacity-[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[var(--yellow)] opacity-[0.04] blur-[100px] rounded-full" />
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
            Bem-vindo<br />
            <span className="verde">de volta.</span>
          </h2>
          
          <p className="fgb-label text-[var(--gray)] max-w-sm mb-10" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14, lineHeight: 1.6 }}>
            Acesse sua conta para gerenciar inscrições, calendário e documentos oficiais da sua equipe na plataforma da FGB.
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
                Acesso ao Sistema
              </h1>
              <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                Digite seu e-mail e senha para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="email" className="fgb-label text-[var(--gray)]">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contato@equipe.com.br"
                  required
                  className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="fgb-label text-[var(--gray)]">Senha</Label>
                  <Link href="#" className="fgb-label text-[var(--verde)] hover:text-[var(--verde-dark)] transition-colors">
                    Esqueceu?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-white border-[var(--border)] text-[var(--black)] placeholder:text-[var(--gray)] rounded-xl h-12 px-4 focus-visible:ring-1 focus-visible:ring-[var(--verde)] focus-visible:border-[var(--verde)] shadow-sm font-sans"
                />
                {error && (
                  <p className="fgb-label text-[var(--red)] mt-2" style={{ textTransform: 'none', letterSpacing: 0 }}>{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full fgb-btn-primary mt-6 h-12"
                disabled={loading}
              >
                {loading ? 'Autenticando...' : 'Acessar Conta'}
              </Button>
            </form>

            <div className="mt-8 text-center relative z-10 pt-6" style={{ borderTop: '0.5px solid var(--border)' }}>
              <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                Não possui conta?{' '}
                <Link href="/register" className="text-[var(--verde)] hover:text-[var(--verde-dark)] transition-colors">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
          
          <p className="fgb-label text-[var(--gray)] text-center mt-6 max-w-sm mx-auto" style={{ opacity: 0.6, fontSize: 9 }}>
            Ao fazer login, você concorda com os Termos de Serviço e Política de Privacidade da Federação Gaúcha de Basketball.
          </p>
        </div>
      </div>
    </div>
  )
}
