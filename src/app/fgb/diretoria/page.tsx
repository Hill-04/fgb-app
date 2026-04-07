import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Diretoria — FGB',
  description: 'Conheça a diretoria da Federação Gaúcha de Basketball.',
}

export default function DiretoriaPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · FGB · Diretoria
        </p>
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">Gestão FGB</p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Diretoria<br /><span className="text-[#FF6B00]">FGB</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
            A diretoria da Federação Gaúcha de Basketball é composta por dirigentes eleitos
            pelos clubes filiados, dedicados ao desenvolvimento do basquete no Rio Grande do Sul.
          </p>
        </div>
        <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8 mb-8 text-center">
          <div className="text-5xl mb-5">👥</div>
          <h2 className="text-xl font-black italic uppercase text-white mb-4" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Composição da Diretoria
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-md mx-auto">
            Para informações atualizadas sobre a composição da diretoria da FGB,
            acesse o site oficial ou entre em contato com a secretaria.
          </p>
          <a
            href="https://basquetegaucho.com.br/diretoria/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
          >
            Ver no site oficial →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] mb-2">Contato</p>
            <h3 className="text-base font-black italic uppercase text-white mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>Secretaria FGB</h3>
            <div className="space-y-2 text-xs text-slate-400">
              <p>📞 (54) 3223-3858</p>
              <p>✉️ fgb@basquetegaucho.com.br</p>
              <p>⏰ Seg-Sex: 8h às 12h · 13h às 17h</p>
            </div>
          </div>
          <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] mb-2">Endereço</p>
            <h3 className="text-base font-black italic uppercase text-white mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>Sede FGB</h3>
            <div className="space-y-2 text-xs text-slate-400">
              <p>📍 Rua Marechal Floriano, 388</p>
              <p>Centro, Caxias do Sul - RS</p>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
