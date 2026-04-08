import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Diretoria — FGB',
  description: 'Conheça a diretoria da Federação Gaúcha de Basketball, eleita pelos clubes filiados para administrar o basquete do Rio Grande do Sul.',
}

const cargos = [
  { cargo: 'Presidente', icon: '👑', badge: 'fgb-badge-verde', desc: 'Responsável pela gestão geral e representação da federação.' },
  { cargo: '1º Vice-Presidente', icon: '🏛️', badge: 'fgb-badge-verde', desc: 'Auxilia na gestão e substitui o presidente em suas ausências.' },
  { cargo: '2º Vice-Presidente', icon: '🏛️', badge: 'fgb-badge-outline', desc: 'Apoia as ações administrativas e representa a diretoria.' },
  { cargo: 'Secretário Geral', icon: '📋', badge: 'fgb-badge-yellow', desc: 'Responsável pela documentação oficial e comunicações internas.' },
  { cargo: '1º Secretário', icon: '📝', badge: 'fgb-badge-outline', desc: 'Auxilia nas funções do secretário geral.' },
  { cargo: 'Diretor Financeiro', icon: '💰', badge: 'fgb-badge-red', desc: 'Gestão dos recursos financeiros da federação.' },
  { cargo: 'Dir. de Arbitragem', icon: '⚖️', badge: 'fgb-badge-orange', desc: 'Coordena o departamento de árbitros e habilitações.' },
  { cargo: 'Dir. de Competições', icon: '🏆', badge: 'fgb-badge-verde', desc: 'Planeja e executa os campeonatos estaduais.' },
]

export default function DiretoriaPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Gestão FGB · Mandato 2024–2028</div>
          <h1 className="fgb-page-header-title">Diretoria</h1>
          <p className="fgb-page-header-sub mx-auto">
            A diretoria da Federação Gaúcha de Basketball é composta por dirigentes eleitos
            pelos clubes filiados, dedicados ao desenvolvimento do basquete no Rio Grande do Sul.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">

        {/* Cargos da Diretoria */}
        <section className="mb-14">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">Composição da <span className="verde">Diretoria</span></h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {cargos.map((c, i) => (
              <div key={i} className="fgb-card p-5 flex items-start gap-4">
                <span className="text-2xl flex-shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`fgb-badge ${c.badge}`}>{c.cargo}</span>
                  </div>
                  <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    {c.desc}
                  </p>
                  <p className="fgb-label mt-2" style={{ color: 'var(--gray)', opacity: 0.6, fontSize: 9 }}>
                    Consulte o site oficial para nome do dirigente atual
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a
              href="https://basquetegaucho.com.br/diretoria/"
              target="_blank"
              rel="noopener noreferrer"
              className="fgb-btn-primary"
            >
              Ver Diretoria Completa no Site Oficial →
            </a>
          </div>
        </section>

        {/* Contato */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          <div className="fgb-card admin-card-verde p-6">
            <div className="fgb-accent fgb-accent-verde mb-4" />
            <h3 className="fgb-display text-[18px] text-[var(--black)] mb-4">Secretaria FGB</h3>
            <div className="space-y-3">
              {[
                { icon: '📞', label: 'Telefone', value: '(54) 3223-3858', href: 'tel:+555432233858' },
                { icon: '✉️', label: 'E-mail', value: 'fgb@basquetegaucho.com.br', href: 'mailto:fgb@basquetegaucho.com.br' },
                { icon: '⏰', label: 'Atendimento', value: 'Seg–Sex: 8h às 12h · 13h às 17h', href: null },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="fgb-label" style={{ color: 'var(--gray)', fontSize: 8 }}>{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="fgb-label hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--verde)', textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                        {item.value}
                      </a>
                    ) : (
                      <p className="fgb-label" style={{ color: 'var(--black)', textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                        {item.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fgb-card admin-card-yellow p-6">
            <div className="fgb-accent fgb-accent-yellow mb-4" />
            <h3 className="fgb-display text-[18px] text-[var(--black)] mb-4">Sede da FGB</h3>
            <div className="space-y-3">
              {[
                { icon: '📍', label: 'Endereço', value: 'Rua Marechal Floriano, 388' },
                { icon: '🏙️', label: 'Cidade', value: 'Centro · Caxias do Sul · RS' },
                { icon: '🇧🇷', label: 'Estado', value: 'Rio Grande do Sul · Brasil' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="fgb-label" style={{ color: 'var(--gray)', fontSize: 8 }}>{item.label}</p>
                    <p className="fgb-label" style={{ color: 'var(--black)', textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Verde */}
        <section className="fgb-cta" style={{ borderRadius: 8 }}>
          <div className="fgb-cta-pattern" />
          <div className="fgb-cta-inner text-center">
            <div className="fgb-accent fgb-accent-yellow mx-auto mb-4" />
            <h2 className="fgb-cta-h" style={{ fontSize: 'clamp(22px, 3vw, 38px)' }}>
              Fale com a <em>Gestão FGB</em>
            </h2>
            <p className="fgb-cta-sub">
              Para assuntos com a diretoria, entre em contato com a secretaria da FGB.
              Atendimento de segunda a sexta, das 8h às 17h.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="mailto:fgb@basquetegaucho.com.br" className="fgb-btn-primary">
                ✉️ Enviar E-mail
              </a>
              <a href="tel:+555432233858" className="fgb-btn-secondary">
                📞 (54) 3223-3858
              </a>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
