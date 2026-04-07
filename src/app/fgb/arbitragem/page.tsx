import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Arbitragem — FGB',
  description: 'Departamento de Arbitragem da Federação Gaúcha de Basketball. Regras, formação e Desafio do Técnico.',
}

const niveisFormacao = [
  { nivel: 'Nível 1', titulo: 'Árbitro Iniciante', desc: 'Formação básica para iniciar as atividades no basquete.', icon: '🎓', color: 'admin-card-verde' },
  { nivel: 'Nível 2', titulo: 'Árbitro Estadual', desc: 'Apto a apitar campeonatos estaduais organizados pela FGB.', icon: '⚖️', color: 'admin-card-yellow' },
  { nivel: 'Nível 3', titulo: 'Árbitro Nacional', desc: 'Habilitado para competições nacionais sob chancela da CBB.', icon: '🏅', color: 'admin-card-red' },
]

export default function ArbitragemPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Departamento FGB</div>
          <h1 className="fgb-page-header-title">Arbitragem</h1>
          <p className="fgb-page-header-sub mx-auto">
            O Departamento de Arbitragem da FGB é responsável pela formação, habilitação
            e supervisão dos árbitros de basquete do Rio Grande do Sul.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        {/* Formação */}
        <section className="mb-14">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">Programa de <span className="verde">Formação</span></h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {niveisFormacao.map((nivel, i) => (
              <div key={i} className={`fgb-card p-6 ${nivel.color}`}>
                <div className="text-3xl mb-4">{nivel.icon}</div>
                <div className="fgb-badge fgb-badge-outline mb-2">{nivel.nivel}</div>
                <h3 className="fgb-display text-[16px] text-[var(--black)] mb-2">{nivel.titulo}</h3>
                <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>{nivel.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Links Relevantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          <div className="fgb-card p-6 border border-[var(--border)]">
            <div className="text-3xl mb-4">📖</div>
            <h3 className="fgb-display text-[18px] text-[var(--black)] mb-2">Regras Oficiais FIBA</h3>
            <p className="fgb-label mb-4 text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Regras oficiais, interpretações e atualizações alinhadas com a FIBA disponíveis.
            </p>
            <a href="https://basquetegaucho.com.br/arbitragem/" target="_blank" rel="noopener noreferrer" className="fgb-label text-[var(--verde)] hover:text-[var(--verde-dark)] transition-colors">
              Acessar Regras →
            </a>
          </div>
          <div className="fgb-card p-6 border border-[var(--border)] admin-card-red">
            <div className="text-3xl mb-4">🔴</div>
            <h3 className="fgb-display text-[18px] text-[var(--black)] mb-2">Desafio do Técnico</h3>
            <p className="fgb-label mb-4 text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Documentação sobre o Desafio do Técnico, recurso permitido conforme regras FIBA vigentes.
            </p>
            <a href="https://basquetegaucho.com.br/arbitragem/" target="_blank" rel="noopener noreferrer" className="fgb-label text-[var(--red)] hover:text-[var(--red-dark)] transition-colors">
              Ver Procedimentos →
            </a>
          </div>
        </div>

        {/* CTA */}
        <section className="fgb-section-verde border border-[var(--border)] rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="fgb-display text-[22px] text-[var(--black)] mb-2">Quero ser árbitro</h2>
            <p className="fgb-label text-[var(--gray)] max-w-lg" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Quer se tornar árbitro de basquete no RS? Entre em contato com o Departamento 
              para informações sobre cursos e habilitação.
            </p>
          </div>
          <a href="mailto:fgb@basquetegaucho.com.br?subject=Interesse em Arbitragem FGB" className="fgb-btn-primary flex-shrink-0">
            Acessar Secretaria FGB
          </a>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
