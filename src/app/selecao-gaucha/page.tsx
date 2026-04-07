import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Seleção Gaúcha — FGB',
  description: 'Seleções gaúchas de basketball - convocações, resultados e informações das categorias Sub 13, Sub 15, Sub 17 e Adulto.',
}

const selecoes = [
  {
    categoria: 'Sub 13',
    genero: 'Masculino',
    icon: '♂️',
    cor: 'border-blue-500/20 from-blue-500/8 to-blue-500/3',
    badge: 'text-blue-400 bg-blue-500/10',
    desc: 'Seleção Gaúcha Sub 13 Masculino representa o RS nas competições nacionais de base.',
  },
  {
    categoria: 'Sub 13',
    genero: 'Feminino',
    icon: '♀️',
    cor: 'border-pink-500/20 from-pink-500/8 to-pink-500/3',
    badge: 'text-pink-400 bg-pink-500/10',
    desc: 'Seleção Gaúcha Sub 13 Feminino compete no Campeonato Brasileiro de Seleções.',
  },
  {
    categoria: 'Sub 15',
    genero: 'Masculino',
    icon: '♂️',
    cor: 'border-blue-500/20 from-blue-500/8 to-blue-500/3',
    badge: 'text-blue-400 bg-blue-500/10',
    desc: 'Uma das principais equipes jovens do basquete gaúcho em âmbito nacional.',
  },
  {
    categoria: 'Sub 15',
    genero: 'Feminino',
    icon: '♀️',
    cor: 'border-pink-500/20 from-pink-500/8 to-pink-500/3',
    badge: 'text-pink-400 bg-pink-500/10',
    desc: 'Formando as futuras representantes do basquete feminino gaúcho.',
  },
  {
    categoria: 'Sub 17',
    genero: 'Masculino',
    icon: '♂️',
    cor: 'border-blue-500/20 from-blue-500/8 to-blue-500/3',
    badge: 'text-blue-400 bg-blue-500/10',
    desc: 'Seleção Gaúcha Sub 17 Masculino — categoria de projeção para athletas de elite.',
  },
  {
    categoria: 'Sub 17',
    genero: 'Feminino',
    icon: '♀️',
    cor: 'border-pink-500/20 from-pink-500/8 to-pink-500/3',
    badge: 'text-pink-400 bg-pink-500/10',
    desc: 'Atletas gaúchas destaques do basquete feminino nacional concentradas aqui.',
  },
  {
    categoria: 'Adulto',
    genero: 'Masculino',
    icon: '♂️',
    cor: 'border-[#FF6B00]/30 from-[#FF6B00]/8 to-[#FF6B00]/3',
    badge: 'text-[#FF6B00] bg-[#FF6B00]/10',
    desc: 'A principal seleção masculina do Rio Grande do Sul. Orgulho do basquete gaúcho.',
  },
  {
    categoria: 'Adulto',
    genero: 'Feminino',
    icon: '♀️',
    cor: 'border-pink-500/30 from-pink-500/8 to-pink-500/3',
    badge: 'text-pink-400 bg-pink-500/10',
    desc: 'A principal seleção feminina gaúcha, representando o estado nas competições adultas.',
  },
]

export default function SelecaoGauchaPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · Seleção Gaúcha
        </p>

        {/* Header */}
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">
            Rio Grande do Sul
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Seleção<br />
            <span className="text-[#FF6B00]">Gaúcha</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-3xl">
            O Rio Grande do Sul possui uma das tradições mais ricas do basquete brasileiro.
            Bi-campeões nacionais em 1934 e 1935, a seleção gaúcha continua produzindo
            atletas de alto nível para o cenário nacional.
          </p>
        </div>

        {/* Legado Histórico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {[
            { value: '1934', label: '1º Título Nacional', icon: '🏆' },
            { value: '1935', label: '2º Título Nacional', icon: '🏅' },
            { value: 'RS', label: 'Potência Nacional', icon: '⭐' },
          ].map((s, i) => (
            <div key={i} className="bg-[#141414] border border-white/[0.08] rounded-3xl p-6 text-center">
              <div className="text-3xl mb-3">{s.icon}</div>
              <p className="text-3xl font-black italic uppercase text-[#FF6B00] mb-1" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                {s.value}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Seleções */}
        <div className="mb-12">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8">
            Seleções Gaúchas Ativas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {selecoes.map((sel, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${sel.cor} border rounded-3xl p-6 hover:scale-[1.01] transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sel.icon}</span>
                    <h3 className="text-lg font-black italic uppercase text-white" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                      {sel.categoria}
                    </h3>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${sel.badge}`}>
                    {sel.genero}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{sel.desc}</p>
                <div className="pt-3 border-t border-white/[0.06]">
                  <a
                    href="https://basquetegaucho.com.br/selecao-gaucha/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline"
                  >
                    Ver mais →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Convocações */}
        <div className="bg-[#141414] border border-[#FF6B00]/15 rounded-3xl p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6B00] mb-3">
            Notas Oficiais
          </p>
          <h2 className="text-xl font-black italic uppercase text-white mb-4" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Convocações e boletins
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-xl">
            As convocações oficiais das seleções gaúchas são publicadas como notas oficiais
            da FGB. Acompanhe as últimas atualizações na página de notas.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/fgb/notas"
              className="inline-block bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
            >
              Ver Notas Oficiais
            </a>
            <a
              href="https://basquetegaucho.com.br/selecao-gaucha/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
            >
              Site Oficial FGB
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
