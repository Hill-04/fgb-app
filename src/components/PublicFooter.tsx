import Link from 'next/link'
import Image from 'next/image'

export function PublicFooter() {
  return (
    <footer className="fgb-footer">
      {/* Tricolor no topo do footer */}
      <div className="fgb-tricolor" style={{ marginBottom: '40px' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Col 1 — Marca */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png"
                  alt="FGB" fill className="object-contain" unoptimized
                />
              </div>
              <div>
                <p className="fgb-heading text-white" style={{ fontSize: 12, letterSpacing: '0.05em', lineHeight: 1 }}>
                  Federação Gaúcha
                </p>
                <p className="fgb-label" style={{ color: '#F5C200', fontSize: 9, marginTop: 2, letterSpacing: '0.18em' }}>
                  de Basketball
                </p>
              </div>
            </div>
            <div className="fgb-label space-y-1" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, lineHeight: 2 }}>
              <span className="block">Rua Marechal Floriano, 388</span>
              <span className="block">Centro · Caxias do Sul · RS</span>
              <span className="block mt-1">(54) 3223-3858</span>
              <span className="block">8h às 12h · 13h às 17h</span>
              <span className="block mt-1">fgb@basquetegaucho.com.br</span>
            </div>
          </div>

          {/* Col 2 — FGB */}
          <div>
            <p className="fgb-label mb-4 pb-3"
              style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, borderBottom: '1px solid rgba(255,255,255,0.1)', letterSpacing: '0.18em' }}>
              FGB
            </p>
            {[
              { label: 'Diretoria',           href: '/fgb/diretoria' },
              { label: 'Fundação',            href: '/fgb/fundacao' },
              { label: 'História',            href: '/fgb/historia' },
              { label: 'Regulamento',         href: '/fgb/regulamento' },
              { label: 'Categorias e Idades', href: '/fgb/categorias' },
              { label: 'Notas Oficiais',      href: '/fgb/notas' },
              { label: 'Arbitragem',          href: '/fgb/arbitragem' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="fgb-footer-link">{link.label}</Link>
            ))}
          </div>

          {/* Col 3 — Campeonatos */}
          <div>
            <p className="fgb-label mb-4 pb-3"
              style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, borderBottom: '1px solid rgba(255,255,255,0.1)', letterSpacing: '0.18em' }}>
              Campeonatos
            </p>
            {[
              { label: 'Todos os Campeonatos', href: '/campeonatos' },
              { label: 'Estadual Feminino',    href: '/campeonatos?filtro=feminino' },
              { label: 'Estadual Masculino',   href: '/campeonatos?filtro=masculino' },
              { label: 'Cestinhas',            href: '/campeonatos/cestinhas' },
              { label: 'Seleção Gaúcha',       href: '/selecao-gaucha' },
              { label: 'Galeria de Fotos',     href: '/galeria' },
            ].map(l => <Link key={l.href} href={l.href} className="fgb-footer-link">{l.label}</Link>)}
          </div>

          {/* Col 4 — Acesso */}
          <div>
            <p className="fgb-label mb-4 pb-3"
              style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, borderBottom: '1px solid rgba(255,255,255,0.1)', letterSpacing: '0.18em' }}>
              Acesso
            </p>
            {[
              { label: 'Entrar na Plataforma', href: '/login', external: false },
              { label: 'Cadastrar Equipe',     href: '/register', external: false },
              { label: 'Facebook',  href: 'https://www.facebook.com/fgb.basquetegaucho', external: true },
              { label: 'Instagram', href: 'https://www.instagram.com/fg_basquete/', external: true },
              { label: 'WhatsApp',  href: 'https://api.whatsapp.com/send?phone=555432233858', external: true },
            ].map(l => (
              l.external ? (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="fgb-footer-link">{l.label}</a>
              ) : (
                <Link key={l.label} href={l.href} className="fgb-footer-link">{l.label}</Link>
              )
            ))}

            <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Link href="/login" className="fgb-btn-primary block text-center"
                style={{ color: 'var(--black)', textAlign: 'center' }}>
                Acessar Painel
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <p className="fgb-label" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
            © {new Date().getFullYear()} Federação Gaúcha de Basketball. Todos os direitos reservados.
          </p>
          <p className="fgb-label" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}>
            FGB Season 26 · Plataforma Oficial
          </p>
        </div>
      </div>
    </footer>
  )
}
