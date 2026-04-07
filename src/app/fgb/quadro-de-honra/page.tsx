import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Quadro de Honra — FGB',
  description: 'Os grandes nomes e títulos do basquete gaúcho no Quadro de Honra da FGB.',
}

export default function QuadroHonraPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · FGB · Quadro de Honra
        </p>
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">Legado</p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Quadro<br /><span className="text-[#FF6B00]">de Honra</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
            O Quadro de Honra da FGB celebra os atletas, técnicos e dirigentes que
            deixaram sua marca na história do basquete gaúcho.
          </p>
        </div>
        <div className="bg-[#141414] border border-[#FF6B00]/15 rounded-3xl p-12 text-center">
          <div className="text-6xl mb-6">🌟</div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6B00] mb-4">
            Honraria máxima do basquete gaúcho
          </p>
          <h2 className="text-2xl font-black italic uppercase text-white mb-6" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Grandes nomes da história
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-8 max-w-md mx-auto">
            Para acessar o Quadro de Honra completo com todos os homenageados
            e suas contribuições para o basquete gaúcho, visite o site oficial da FGB.
          </p>
          <a
            href="https://basquetegaucho.com.br/quadro-de-honra/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-xl transition-all"
          >
            Ver Quadro de Honra completo →
          </a>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
