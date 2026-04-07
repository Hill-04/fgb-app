'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'

const FGB_LOGO = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'

const navItems = [
  { label: 'Início', href: '/' },
  {
    label: 'FGB',
    href: '#',
    children: [
      { label: 'História da Federação', href: '/fgb/historia' },
      { label: 'Categorias e Idades', href: '/fgb/categorias' },
      { label: 'Regulamento Desportivo', href: '/fgb/regulamento' },
      { label: 'Notas Oficiais', href: '/fgb/notas' },
      { label: 'Arbitragem', href: '/fgb/arbitragem' },
      { label: 'Diretoria', href: '/fgb/diretoria' },
    ],
  },
  {
    label: 'Campeonatos',
    href: '/campeonatos',
    children: [
      { label: 'Todos os Campeonatos', href: '/campeonatos' },
      { label: 'Estadual Feminino', href: '/campeonatos?filtro=feminino' },
      { label: 'Estadual Masculino', href: '/campeonatos?filtro=masculino' },
      { label: 'Cestinhas', href: '/campeonatos/cestinhas' },
      { label: 'Normas do Estadual', href: '/fgb/regulamento' },
    ],
  },
  { label: 'Seleção Gaúcha', href: '/selecao-gaucha' },
  { label: 'Galeria', href: '/galeria' },
]

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* TOP BAR — preta com contato */}
      <div style={{ background: '#111111' }} className="hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {['(54) 3223-3858', '8h às 12h · 13h às 17h', 'fgb@basquetegaucho.com.br'].map((t) => (
              <span key={t} className="fgb-label" style={{ color: '#555' }}>
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Facebook', href: 'https://www.facebook.com/fgb.basquetegaucho' },
              { label: 'Instagram', href: 'https://www.instagram.com/fg_basquete/' },
              { label: 'WhatsApp', href: 'https://api.whatsapp.com/send?phone=555432233858' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="fgb-label transition-colors duration-150"
                style={{ color: '#555' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FF6B00')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* HEADER PRINCIPAL — branco com borda laranja 3px */}
      <header className={`fgb-header${scrolled ? ' scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-stretch justify-between" style={{ height: 60 }}>

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="relative" style={{ width: 36, height: 36 }}>
              <Image
                src={FGB_LOGO}
                alt="Federação Gaúcha de Basketball"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <div className="hidden sm:block">
              <p
                style={{
                  fontFamily: "'Arial Black', Arial, sans-serif",
                  fontSize: 13,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  color: '#111',
                }}
              >
                Federação Gaúcha
              </p>
              <p className="fgb-label mt-0.5" style={{ color: '#FF6B00' }}>
                de Basketball
              </p>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-stretch">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative flex items-center"
                onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-4 fgb-label transition-colors duration-150"
                  style={{
                    height: '100%',
                    color: activeDropdown === item.label ? '#FF6B00' : '#444',
                    borderBottom: activeDropdown === item.label ? '3px solid #FF6B00' : '3px solid transparent',
                    marginBottom: -3,
                  }}
                  onMouseEnter={(e) => {
                    if (!item.children) {
                      e.currentTarget.style.color = '#FF6B00'
                      e.currentTarget.style.borderBottom = '3px solid #FF6B00'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.children || activeDropdown !== item.label) {
                      e.currentTarget.style.color = '#444'
                      e.currentTarget.style.borderBottom = '3px solid transparent'
                    }
                  }}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      className="transition-transform duration-150"
                      style={{
                        width: 12,
                        height: 12,
                        transform: activeDropdown === item.label ? 'rotate(180deg)' : 'rotate(0)',
                      }}
                    />
                  )}
                </Link>

                {/* Dropdown */}
                {item.children && activeDropdown === item.label && (
                  <div className="fgb-dropdown">
                    {item.children.map((child) => (
                      <a key={child.href} href={child.href}>
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA + MOBILE BUTTON */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-fgb-primary hidden lg:inline-block">
              Entrar
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 transition-colors"
              style={{ color: '#444' }}
            >
              {mobileOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div
            className="lg:hidden"
            style={{ borderTop: '1px solid #E5E5E5', background: '#fff' }}
          >
            <div className="px-4 py-3">
              {navItems.map((item) => (
                <div key={item.label}>
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 fgb-label transition-all"
                    style={{ color: '#444' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#FF6B00'
                      e.currentTarget.style.background = '#F7F7F7'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#444'
                      e.currentTarget.style.background = ''
                    }}
                  >
                    {item.label}
                  </a>
                  {item.children?.map((child) => (
                    <a
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block fgb-label transition-all"
                      style={{
                        paddingLeft: 28,
                        paddingRight: 12,
                        paddingTop: 8,
                        paddingBottom: 8,
                        fontSize: 9,
                        color: '#888',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#FF6B00'
                        e.currentTarget.style.background = '#F7F7F7'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#888'
                        e.currentTarget.style.background = ''
                      }}
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              ))}
              <div style={{ paddingTop: 12, borderTop: '1px solid #E5E5E5', marginTop: 8 }}>
                <a href="/login" className="btn-fgb-primary block text-center">
                  Entrar na Plataforma
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
