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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.1)_0,transparent_50%)]" />
        <div className="w-12 h-12 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-50 flex flex-col selection:bg-orange-500/30">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-orange-600/[0.08] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/[0.05] blur-[120px] rounded-full" />
      </div>

      {/* Header - Apple Glass Style */}
      <header className="px-6 lg:px-14 h-20 flex items-center border-b border-white/[0.04] bg-black/40 backdrop-blur-2xl saturate-150 sticky top-0 z-50">
        <div className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center rounded-[10px] shadow-[0_4px_20px_rgba(234,88,12,0.4)] transition-transform duration-300 group-hover:scale-105 shrink-0">
            <span className="font-display font-black text-white text-xs tracking-tight">FGB</span>
          </div>
          <div className="leading-none">
            <div className="font-display font-bold text-xs text-white tracking-[0.2em] uppercase">Federação Gaúcha</div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">de Basquete</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 md:py-24 relative z-10">
        <div className="text-center mb-16 md:mb-24 animate-fade-up">
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] backdrop-blur-md px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            <span className="text-[11px] font-bold text-slate-300 tracking-[0.2em] uppercase">
              Etapa de Integração
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-display font-black uppercase text-white mb-6 tracking-tight">
            Bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{(session?.user as any)?.name?.split(' ')[0] || 'Atleta'}</span>!
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
            Você ainda não faz parte de nenhuma equipe na plataforma. Para prosseguir e ter acesso aos campeonatos da FGB, escolha uma das opções abaixo:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card: Criar Equipe */}
          <Link href="/team/create" className="group">
            <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl rounded-[2rem] p-8 md:p-10 h-full relative overflow-hidden transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(234,88,12,0.2)] animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/5 pointer-events-none" />
              
              <div className="relative z-10 mb-8">
                <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 group-hover:bg-white/[0.08] transition-all duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-4 tracking-tight">Criar Nova Equipe</h2>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Torne-se o gestor (Head Coach) de uma nova equipe. Cadastre jogadores, comissão técnica e participe de competições oficiais.
                </p>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-12 rounded-xl shadow-[0_0_30px_-5px_rgba(234,88,12,0.4)] transition-all group-hover:shadow-[0_0_40px_-5px_rgba(234,88,12,0.6)] relative z-10">
                Criar Equipe
              </Button>
            </div>
          </Link>

          {/* Card: Entrar em Equipe */}
          <Link href="/team/join" className="group">
            <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl rounded-[2rem] p-8 md:p-10 h-full relative overflow-hidden transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.2)] animate-fade-up" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/5 pointer-events-none" />
              
              <div className="relative z-10 mb-8">
                <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 group-hover:bg-white/[0.08] transition-all duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-4 tracking-tight">Vincular a uma Equipe</h2>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Solicite acesso a uma equipe já existente no sistema. O Head Coach da equipe receberá sua notificação para aprovação.
                </p>
              </div>
              <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 font-bold h-12 rounded-xl transition-all relative z-10">
                Procurar Equipes
              </Button>
            </div>
          </Link>
        </div>

        {/* Info adicional */}
        <div className="mt-16 max-w-3xl mx-auto p-6 bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] backdrop-blur-xl flex items-start gap-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white mb-1 tracking-tight">Aviso Legal</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Todos os dados fornecidos estão sujeitos à validação da Federação Gaúcha de Basquete. Certifique-se de usar informações reais para evitar a suspensão da sua conta ou da sua equipe.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
