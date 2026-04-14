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
      return;
    }
    if (status !== 'authenticated') return;

    const membershipStatus = (session?.user as any)?.membershipStatus;
    if (membershipStatus === 'ACTIVE') {
      router.push('/team/dashboard');
    } else if (membershipStatus === 'PENDING') {
      router.push('/team/request-status');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.05)_0,transparent_50%)]" />
        <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4" />
        <p className="text-[var(--gray)] font-medium tracking-widest uppercase text-xs">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[var(--black)] flex flex-col font-sans selection:bg-orange-500/30">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-orange-600/[0.03] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/[0.02] blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="px-6 lg:px-14 h-20 flex items-center border-b border-[var(--border)] bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center rounded-lg shadow-sm shrink-0">
            <span className="font-display font-black text-white text-xs tracking-wider">FGB</span>
          </div>
          <div className="leading-none">
            <div className="font-display font-black text-xs text-[var(--black)] tracking-[0.2em] uppercase italic">Federação Gaúcha</div>
            <div className="text-[10px] text-[var(--gray)] font-bold tracking-widest uppercase mt-0.5">de Basquete</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 md:py-24 relative z-10">
        <div className="text-center mb-16 md:mb-24 animate-fade-up">
          <div className="inline-flex items-center gap-2 border border-[var(--border)] bg-white px-4 py-2 rounded-full mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-sm" />
            <span className="text-[11px] font-bold text-[var(--gray)] tracking-[0.2em] uppercase">
              Etapa de Integração
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-display font-black uppercase text-[var(--black)] mb-6 tracking-tight italic">
            Bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">{(session?.user as any)?.name?.split(' ')[0] || 'Atleta'}</span>!
          </h1>
          <p className="text-lg text-[var(--gray)] max-w-2xl mx-auto font-medium">
            Você ainda não faz parte de nenhuma equipe na plataforma. Para prosseguir e ter acesso aos campeonatos da FGB, escolha uma das opções abaixo:
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-10 rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)] mb-4">
            Fluxo da conta
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-[var(--gray)]">
            <div className="rounded-2xl bg-gray-50 border border-[var(--border)] p-4">
              <p className="font-black text-[var(--black)] mb-1">1. Escolha o caminho</p>
              <p>Crie uma equipe nova ou solicite entrada em uma equipe existente.</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-[var(--border)] p-4">
              <p className="font-black text-[var(--black)] mb-1">2. Validacao</p>
              <p>Somente equipes completas e aprovadas liberam acesso total ao portal da equipe.</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-[var(--border)] p-4">
              <p className="font-black text-[var(--black)] mb-1">3. Operacao</p>
              <p>Depois disso voce acompanha campeonatos, jogos, documentos e inscricoes.</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card: Criar Equipe */}
          <Link href="/team/create" className="group">
            <div className="fgb-card bg-white border border-[var(--border)] rounded-[2rem] p-8 md:p-10 h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lg animate-fade-up shadow-sm" style={{ animationDelay: '100ms' }}>
              <div className="relative z-10 mb-8">
                <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-[var(--black)] mb-4 tracking-tight uppercase italic">Criar Nova Equipe</h2>
                <p className="text-[var(--gray)] leading-relaxed font-medium">
                  Torne-se o gestor (Head Coach) de uma nova equipe. Cadastre jogadores, comissão técnica e participe de competições oficiais.
                </p>
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase tracking-widest h-12 rounded-xl shadow-sm transition-all relative z-10">
                Criar Equipe
              </Button>
            </div>
          </Link>

          {/* Card: Entrar em Equipe */}
          <Link href="/team/join" className="group">
            <div className="fgb-card bg-white border border-[var(--border)] rounded-[2rem] p-8 md:p-10 h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lg animate-fade-up shadow-sm" style={{ animationDelay: '200ms' }}>
              <div className="relative z-10 mb-8">
                <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-[var(--black)] mb-4 tracking-tight uppercase italic">Vincular a uma Equipe</h2>
                <p className="text-[var(--gray)] leading-relaxed font-medium">
                  Solicite acesso a uma equipe já existente no sistema. O Head Coach da equipe receberá sua notificação para aprovação.
                </p>
              </div>
              <Button variant="outline" className="w-full border-[var(--border)] text-[var(--gray)] hover:bg-gray-50 font-black uppercase tracking-widest h-12 rounded-xl transition-all relative z-10">
                Procurar Equipes
              </Button>
            </div>
          </Link>
        </div>

        {/* Info adicional */}
        <div className="mt-16 max-w-3xl mx-auto p-6 bg-white border border-[var(--border)] rounded-[1.5rem] shadow-sm flex items-start gap-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="w-10 h-10 rounded-full bg-gray-50 border border-[var(--border)] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[var(--black)] mb-1 tracking-tight">Aviso Legal</h3>
            <p className="text-sm text-[var(--gray)] leading-relaxed font-medium">
              Todos os dados fornecidos estão sujeitos à validação da Federação Gaúcha de Basquete. Certifique-se de usar informações reais para evitar a suspensão da sua conta ou da sua equipe.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
