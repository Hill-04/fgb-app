'use client'

import Link from 'next/link'
import Image from 'next/image'

const FGB_LOGO = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'

const fgbLinks = [
  { label: 'Diretoria', href: '/fgb/diretoria' },
  { label: 'Fundação', href: '/fgb/fundacao' },
  { label: 'História', href: '/fgb/historia' },
  { label: 'Regulamento', href: '/fgb/regulamento' },
  { label: 'Categorias e Idades', href: '/fgb/categorias' },
  { label: 'Arbitragem', href: '/fgb/arbitragem' },
  { label: 'Notas Oficiais', href: '/fgb/notas' },
]

const campLinks = [
  { label: 'Todos os Campeonatos', href: '/campeonatos' },
  { label: 'Estadual Feminino', href: '/campeonatos?filtro=feminino' },
  { label: 'Estadual Masculino', href: '/campeonatos?filtro=masculino' },
  { label: 'Cestinhas', href: '/campeonatos/cestinhas' },
  { label: 'Seleção Gaúcha', href: '/selecao-gaucha' },
  { label: 'Galeria de Fotos', href: '/galeria' },
]

const accessLinks = [
  { label: 'Entrar na Plataforma', href: '/login', external: false },
  { label: 'Cadastrar Equipe', href: '/register', external: false },
  { label: 'Facebook', href: 'https://www.facebook.com/fgb.basquetegaucho', external: true },
  { label: 'Instagram', href: 'https://www.instagram.com/fg_basquete/', external: true },
  { label: 'WhatsApp', href: 'https://api.whatsapp.com/send?phone=555432233858', external: true },
]

export function PublicFooter() {
  return (
    <>
      {/* Estilos inline via style tag para hover sem JS */}
      <style>{`
        .footer-link {
          display: block;
          font-family: Arial, sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 10px;
          color: #666;
          text-decoration: none;
          margin-bottom: 12px;
          transition: color 0.15s ease;
        }
        .footer-link:hover { color: #FF6B00; }
        .footer-col-title {
          font-family: Arial, sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 10px;
          color: #444;
          padding-bottom: 12px;
          margin-bottom: 16px;
          border-bottom: 1px solid #2a2a2a;
        }
      `}</style>

      <footer style={{ background: '#111111' }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

            {/* Coluna 1 — Marca */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                  <Image
                    src={FGB_LOGO}
                    alt="FGB"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <p style={{
                    fontFamily: "'Arial Black', Arial, sans-serif",
                    fontSize: 12,
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    lineHeight: 1,
                  }}>
                    Federação Gaúcha
                  </p>
                  <p style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontSize: 10,
                    color: '#FF6B00',
                    marginTop: 4,
                  }}>
                    de Basketball
                  </p>
                </div>
              </div>
              <div style={{
                fontFamily: 'Arial, sans-serif',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: 10,
                color: '#555',
                lineHeight: 2.2,
              }}>
                <span className="block">Rua Marechal Floriano, 388</span>
                <span className="block">Centro, Caxias do Sul - RS</span>
                <span className="block" style={{ marginTop: 6 }}>(54) 3223-3858</span>
                <span className="block">8h às 12h · 13h às 17h</span>
                <span className="block" style={{ marginTop: 6 }}>fgb@basquetegaucho.com.br</span>
              </div>
            </div>

            {/* Coluna 2 — FGB */}
            <div>
              <div className="footer-col-title">FGB</div>
              {fgbLinks.map((link) => (
                <Link key={link.href} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Coluna 3 — Campeonatos */}
            <div>
              <div className="footer-col-title">Campeonatos</div>
              {campLinks.map((link) => (
                <Link key={link.href} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Coluna 4 — Acesso */}
            <div>
              <div className="footer-col-title">Acesso</div>
              {accessLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="footer-link"
                >
                  {link.label}
                </a>
              ))}
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2a2a2a' }}>
                <Link href="/login" className="btn-fgb-primary block text-center">
                  Acessar Painel
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid #1a1a1a', paddingTop: 20 }}
          >
            <p style={{
              fontFamily: 'Arial, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: 10,
              color: '#444',
            }}>
              © {new Date().getFullYear()} Federação Gaúcha de Basketball. Todos os direitos reservados.
            </p>
            <p style={{
              fontFamily: 'Arial, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: 10,
              color: '#333',
            }}>
              FGB Season 26 · Plataforma Oficial
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
