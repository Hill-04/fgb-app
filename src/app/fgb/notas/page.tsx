import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { FileText, Download } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Notas Oficiais — FGB',
  description: 'Comunicados, resoluções e convocações oficiais da Federação Gaúcha de Basketball.',
}

const notas = [
  { numero: '065/2026', titulo: 'Regulamento Geral de Competições — Temporada 2026', data: '15/Abr/2026', tipo: 'Regulamento', badge: 'fgb-badge-red' },
  { numero: '064/2026', titulo: 'Convocação Seleção Gaúcha Sub-15 Masculina', data: '12/Abr/2026', tipo: 'Convocação', badge: 'fgb-badge-verde' },
  { numero: '063/2026', titulo: 'Tabela Provisória — Estadual Adulto Masculino', data: '10/Abr/2026', tipo: 'Tabela', badge: 'fgb-badge-yellow' },
  { numero: '062/2026', titulo: 'Homologação de Arbitragem — Quartas de Final', data: '08/Abr/2026', tipo: 'Arbitragem', badge: 'fgb-badge-orange' },
]

export default function NotasPage() {
  return (
    <div className="bg-[#F7F8F4] min-h-screen">
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Secretaria FGB</div>
          <h1 className="fgb-page-header-title">Notas Oficiais</h1>
          <p className="fgb-page-header-sub mx-auto">
            Acesse os documentos, resoluções e comunicados oficiais emitidos pela 
            Federação Gaúcha de Basketball para a temporada vigente.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        
        <section className="mb-14">
           <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-red" />
              <h2 className="fgb-section-title">Últimas <span className="red">Publicações</span></h2>
            </div>
          </div>

          <div className="space-y-4">
            {notas.map((nota, i) => (
              <div key={i} className="fgb-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[var(--red)]">
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-[var(--gray-l)] flex items-center justify-center rounded-lg text-2xl">
                      <FileText className="w-6 h-6 text-[var(--gray)]" />
                   </div>
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="fgb-label text-[9px] opacity-40">NOTA Nº {nota.numero}</span>
                         <span className={`fgb-badge ${nota.badge}`}>{nota.tipo}</span>
                      </div>
                      <h3 className="fgb-display text-base text-[var(--black)] mb-1">{nota.titulo}</h3>
                      <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>Publicado em {nota.data}</p>
                   </div>
                </div>
                
                <button className="fgb-btn-primary flex items-center gap-2 justify-center">
                   <Download className="w-4 h-4" /> DOWNLOAD PDF
                </button>
              </div>
            ))}
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
