import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Fundação — FGB',
  description: 'A fundação da Federação Gaúcha de Basketball em 18 de abril de 1952.',
}

export default function FundacaoPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · FGB · Fundação
        </p>
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">18 de abril de 1952</p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Fundação<br /><span className="text-[#FF6B00]">da FGB</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
            Em 18 de abril de 1952, Porto Alegre sediou o evento histórico que daria origem
            à Federação Gaúcha de Basketball — a entidade que governa o basquete
            do Rio Grande do Sul até hoje.
          </p>
        </div>
        <div className="space-y-5">
          <div className="bg-[#141414] border border-[#FF6B00]/20 rounded-3xl p-8">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent rounded-t-3xl" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] mb-4">O Momento da Fundação</p>
            <h2 className="text-2xl font-black italic uppercase text-white mb-4" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              18 de Abril de 1952
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Em Porto Alegre, com presença de representantes de 22 clubes do estado,
              foi realizada a assembleia de fundação da Federação Gaúcha de Basketball.
              José Carlos Daut foi eleito como primeiro presidente da entidade,
              que nasceu com o objetivo de organizar e fomentar o basquete gaúcho.
            </p>
          </div>
          <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8">
            <h2 className="text-xl font-black italic uppercase text-white mb-4" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Primeiro Presidente
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center text-3xl">
                👤
              </div>
              <div>
                <p className="text-base font-black uppercase text-white">José Carlos Daut</p>
                <p className="text-xs text-[#FF6B00] uppercase tracking-widest mt-1">1º Presidente da FGB · 1952</p>
              </div>
            </div>
          </div>
          <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8">
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Para mais informações sobre a fundação e o histórico completo da FGB,
              acesse o site oficial.
            </p>
            <a
              href="https://basquetegaucho.com.br/fundacao/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline"
            >
              Ver no site oficial →
            </a>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
