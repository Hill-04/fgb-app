'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    // Se tem equipe, redirecionar para dashboard
    if (session?.user && (session.user as any).teamId) {
      router.push('/team/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[--bg-main] flex items-center justify-center">
        <div className="text-[--text-secondary]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--bg-main] text-[--text-main]">
      {/* Header */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-[--border-color] bg-[--bg-sidebar]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[--orange] flex items-center justify-center rotate-45">
            <span className="font-display font-black text-white text-xs -rotate-45">FGB</span>
          </div>
          <div className="text-sm font-semibold text-[--text-main]">
            Federação Gaúcha de Basquete
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="text-4xl font-display font-black uppercase text-white mb-4">
            Bem-vindo, {(session?.user as any)?.name}!
          </h1>
          <p className="text-lg text-[--text-secondary]">
            Você ainda não faz parte de nenhuma equipe. Escolha uma opção abaixo:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card: Criar Equipe */}
          <Link href="/team/create" className="group">
            <div className="card-fgb p-8 h-full hover:border-[--orange] transition-all duration-300 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-[--orange]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[--orange]/20 transition-colors">
                  <svg className="w-8 h-8 text-[--orange]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-3">Criar Minha Equipe</h2>
                <p className="text-[--text-secondary] leading-relaxed">
                  Crie uma nova equipe e torne-se o Head Coach. Você poderá gerenciar membros,
                  fazer inscrições em campeonatos e muito mais.
                </p>
              </div>
              <Button className="w-full bg-[--orange] hover:bg-[--orange-hover] text-white">
                Criar Equipe
              </Button>
            </div>
          </Link>

          {/* Card: Entrar em Equipe */}
          <Link href="/team/join" className="group">
            <div className="card-fgb p-8 h-full hover:border-[--blue-admin] transition-all duration-300 animate-fade-up" style={{ animationDelay: '200ms' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-[--blue-admin]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[--blue-admin]/20 transition-colors">
                  <svg className="w-8 h-8 text-[--blue-admin]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-3">Entrar em uma Equipe</h2>
                <p className="text-[--text-secondary] leading-relaxed">
                  Procure uma equipe existente e solicite entrada. O Head Coach da equipe
                  irá analisar e aprovar sua solicitação.
                </p>
              </div>
              <Button variant="outline" className="w-full border-[--blue-admin] text-[--blue-admin] hover:bg-[--blue-admin]/10">
                Procurar Equipes
              </Button>
            </div>
          </Link>
        </div>

        {/* Info adicional */}
        <div className="mt-12 p-6 bg-[--bg-card] border border-[--border-color] rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[--blue-light] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-white mb-1">Informação</h3>
              <p className="text-sm text-[--text-secondary]">
                Para participar dos campeonatos da FGB, você precisa fazer parte de uma equipe.
                Escolha criar sua própria equipe ou solicitar entrada em uma equipe existente.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
