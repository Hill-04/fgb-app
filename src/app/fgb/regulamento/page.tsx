import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Regulamento Desportivo — FGB',
  description: 'Regulamento desportivo oficial, normas do estadual, regimento de taxas e documentos da Federação Gaúcha de Basketball.',
}

const documentos = [
  { icon: '📋', titulo: 'Regulamento Desportivo', desc: 'Regras gerais que norteiam todos os campeonatos e competições.', categoria: 'Oficial', badge: 'fgb-badge-verde' },
  { icon: '📐', titulo: 'Normas do Estadual', desc: 'Normas específicas para o campeonato estadual (formato, playoffs).', categoria: 'Estadual', badge: 'fgb-badge-yellow' },
  { icon: '💰', titulo: 'Regimento de Taxas', desc: 'Valores de inscrição, taxas de filiação e arbitragem.', categoria: 'Secretaria', badge: 'fgb-badge-orange' },
  { icon: '📝', titulo: 'Atas de Reunião', desc: 'Atas das assembleias e reuniões da diretoria.', categoria: 'Secretaria', badge: 'fgb-badge-outline' },
  { icon: '⚖️', titulo: 'Código de Ética', desc: 'Regras de conduta aplicáveis a atletas, técnicos e dirigentes.', categoria: 'Oficial', badge: 'fgb-badge-red' },
  { icon: '🏀', titulo: 'Regras Oficiais FIBA', desc: 'Regras oficiais traduzidas para o basquete gaúcho.', categoria: 'Regras', badge: 'fgb-badge-outline' },
]

export default function RegulamentoPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Documentos Oficiais</div>
          <h1 className="fgb-page-header-title">Regulamento</h1>
          <p className="fgb-page-header-sub mx-auto">
            Acesse os documentos oficiais da Federação Gaúcha de Basketball.
            Para obter as versões atualizadas dos regulamentos, entre em contato
            com a secretaria da FGB.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        {/* Documentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {documentos.map((doc, i) => (
            <div key={i} className="fgb-card p-6 border border-[var(--border)]">
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{doc.icon}</span>
                <span className={`fgb-badge ${doc.badge}`}>{doc.categoria}</span>
              </div>
              <h3 className="fgb-display text-[18px] text-[var(--black)] mb-2">
                {doc.titulo}
              </h3>
              <p className="fgb-label text-[var(--gray)] mb-4" style={{ textTransform: 'none', letterSpacing: 0 }}>{doc.desc}</p>
              <div className="pt-4" style={{ borderTop: '0.5px solid var(--border)' }}>
                <a href={`mailto:fgb@basquetegaucho.com.br?subject=Solicito ${doc.titulo}`} className="fgb-label text-[var(--verde)] hover:text-[var(--verde-dark)] transition-colors">
                  Solicitar documento →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Contato */}
        <div className="fgb-section-verde border border-[var(--verde-light)] rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="fgb-display text-[20px] text-[var(--black)] mb-2">Precisa de um documento?</h2>
            <p className="fgb-label text-[var(--gray)] max-w-lg" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Solicite os documentos diretamente com a secretaria da FGB pelo e-mail
              ou telefone. Nosso horário de atendimento é de segunda a sexta,
              das 8h às 12h e das 13h às 17h.
            </p>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <a href="mailto:fgb@basquetegaucho.com.br" className="fgb-btn-primary" style={{ background: 'var(--verde)', color: '#fff' }}>
              ✉️ fgb@basquetegaucho.com.br
            </a>
            <a href="tel:+555432233858" className="fgb-btn-secondary" style={{ borderColor: 'var(--border)', color: 'var(--black)' }}>
              📞 (54) 3223-3858
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
