import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Arbitragem — FGB',
  description: 'Departamento de Arbitragem da Federação Gaúcha de Basketball. Regras, formação e Desafio do Técnico.',
}

const niveisFormacao = [
  {
    nivel: 'Nível 1',
    titulo: 'Árbitro Iniciante',
    desc: 'Formação básica para árbitros iniciantes. Regras fundamentais, mecânica básica e posicionamento em quadra.',
    icon: '🎓',
    cor: 'border-slate-500/20',
  },
  {
    nivel: 'Nível 2',
    titulo: 'Árbitro Estadual',
    desc: 'Habilitação para apitar campeonatos estaduais organizados pela FGB. Mecânica avançada e gestão de jogo.',
    icon: '⚖️',
    cor: 'border-blue-500/20',
  },
  {
    nivel: 'Nível 3',
    titulo: 'Árbitro Nacional',
    desc: 'Preparação para competições nacionais sob gestão da CBB. Exige aprovação em curso específico.',
    icon: '🏅',
    cor: 'border-[#FF6B00]/20',
  },
]

export default function ArbitragemPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · FGB · Arbitragem
        </p>

        {/* Header */}
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">
            Departamento de Arbitragem
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Arbitragem<br />
            <span className="text-[#FF6B00]">Gaúcha</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-3xl">
            O Departamento de Arbitragem da FGB é responsável pela formação, habilitação
            e supervisão dos árbitros de basquete do Rio Grande do Sul, garantindo
            a qualidade e a integridade das competições.
          </p>
        </div>

        {/* Formação */}
        <div className="mb-14">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">
            Programa de Formação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {niveisFormacao.map((nivel, i) => (
              <div
                key={i}
                className={`bg-[#141414] border ${nivel.cor} rounded-3xl p-6`}
              >
                <div className="text-3xl mb-4">{nivel.icon}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] mb-2">
                  {nivel.nivel}
                </div>
                <h3 className="text-base font-black italic uppercase text-white mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                  {nivel.titulo}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{nivel.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Regras e Desafio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-6">
            <div className="text-3xl mb-4">📖</div>
            <h3 className="text-base font-black italic uppercase text-white mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Regras Oficiais FIBA
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              O Departamento de Arbitragem da CBB mantém as regras oficiais,
              interpretações e atualizações alinhadas com a FIBA atualizadas
              e disponíveis para todos os árbitros gaúchos.
            </p>
            <a
              href="https://basquetegaucho.com.br/arbitragem/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline"
            >
              Acessar regras →
            </a>
          </div>

          <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-6">
            <div className="text-3xl mb-4">🔴</div>
            <h3 className="text-base font-black italic uppercase text-white mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Desafio do Técnico
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Documentação e procedimentos oficiais sobre o Desafio do Técnico,
              recurso permitido em determinadas categorias e competições conforme
              regras FIBA vigentes.
            </p>
            <a
              href="https://basquetegaucho.com.br/arbitragem/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline"
            >
              Ver procedimentos →
            </a>
          </div>
        </div>

        {/* Contato do Departamento */}
        <div className="bg-[#141414] border border-[#FF6B00]/15 rounded-3xl p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6B00] mb-3">
            Departamento de Arbitragem
          </p>
          <h2 className="text-xl font-black italic uppercase text-white mb-4" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Quero ser árbitro
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-xl">
            Interessado em se tornar árbitro de basquete no Rio Grande do Sul?
            Entre em contato com o Departamento de Arbitragem da FGB para
            informações sobre cursos, habilitação e oportunidades.
          </p>
          <a
            href="mailto:fgb@basquetegaucho.com.br?subject=Interesse em Arbitragem FGB"
            className="inline-block bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
          >
            Entrar em contato →
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
