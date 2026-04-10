import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Notas Oficiais — FGB',
  description: 'Notas e comunicados oficiais da Federacao Gaucha de Basketball.',
}

const notasOficiais = [
  { numero: '063/2025', titulo: 'Tabela Campeonato Estadual Sub 12 Misto - 2a Fase', data: '2025', tipo: 'Tabela de Jogos', desc: 'Divulga a tabela oficial da 2a fase do Campeonato Estadual Sub 12 Misto.', badge: 'fgb-badge-yellow' },
  { numero: '062/2025', titulo: 'Convocacao Selecao Gaucha Sub 13 Masculina', data: '2025', tipo: 'Convocacao', desc: 'Convocacao oficial dos atletas para a selecao gaucha sub 13.', badge: 'fgb-badge-verde' },
  { numero: '061/2025', titulo: 'Classificacao Final - Estadual de Base 2025', data: '2025', tipo: 'Classificacao', desc: 'Classificacao final das categorias de base.', badge: 'fgb-badge-orange' },
  { numero: '060/2025', titulo: 'Boletim Sul Brasileiro de Clubes 2025', data: 'Agosto 2025', tipo: 'Boletim', desc: 'Boletim oficial do Sul Brasileiro de Clubes.', badge: 'fgb-badge-outline' },
]

export default function NotasPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Comunicados</div>
          <h1 className="fgb-page-header-title">Notas Oficiais</h1>
          <p className="fgb-page-header-sub mx-auto">
            Comunicados, resolucoes, tabelas e convocacoes oficiais emitidos pela
            Federacao Gaucha de Basketball.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <section className="mb-14 space-y-4">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-red" />
              <h2 className="fgb-section-title">Ultimas <span className="red">Notas</span></h2>
            </div>
          </div>
          
          {notasOficiais.map((nota, i) => (
            <div key={i} className="fgb-card p-6 border border-[var(--border)]">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="fgb-badge fgb-badge-outline bg-[var(--gray-l)]">Nota nº {nota.numero}</span>
                  <span className={`fgb-badge ${nota.badge}`}>{nota.tipo}</span>
                </div>
                <span className="fgb-label text-[var(--gray)]">{nota.data}</span>
              </div>
              <h3 className="fgb-display text-[16px] text-[var(--black)] mb-2">
                {nota.titulo}
              </h3>
              <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>{nota.desc}</p>
            </div>
          ))}
        </section>

        <div className="fgb-section-yellow rounded-xl p-8 text-center border border-[var(--border)] shadow-sm">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="fgb-display text-[22px] text-[var(--black)] mb-2">Arquivo Completo</h2>
          <p className="fgb-label text-[var(--gray)] max-w-md mx-auto mb-6" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Para acessar o arquivo completo de notas oficiais, convocacoes e regulamentos,
            visite o site oficial da FGB.
          </p>
          <a href="https://basquetegaucho.com.br/notas-oficiais/" target="_blank" rel="noopener noreferrer" className="fgb-btn-primary">
            Ver todas no site oficial →
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
