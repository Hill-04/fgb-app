'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'

const navItems = [
  { label: 'Início', href: '/' },
  {
    label: 'FGB', href: '#',
    children: [
      { label: 'História da Federação', href: '/fgb/historia' },
      { label: 'Categorias e Idades',  href: '/fgb/categorias' },
      { label: 'Regulamento',          href: '/fgb/regulamento' },
      { label: 'Notas Oficiais',       href: '/fgb/notas' },
      { label: 'Arbitragem',           href: '/fgb/arbitragem' },
      { label: 'Diretoria',            href: '/fgb/diretoria' },
    ]
  },
  {
    label: 'Campeonatos', href: '/campeonatos',
    children: [
      { label: 'Todos os Campeonatos', href: '/campeonatos' },
      { label: 'Estadual Feminino',    href: '/campeonatos?filtro=feminino' },
      { label: 'Estadual Masculino',   href: '/campeonatos?filtro=masculino' },
      { label: 'Cestinhas',            href: '/campeonatos/cestinhas' },
      { label: 'Normas do Estadual',   href: '/campeonatos/normas' },
    ]
  },
  { label: 'Seleção Gaúcha', href: '/selecao-gaucha' },
  { label: 'Galeria',        href: '/galeria' },
]

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdown, setDropdown] = useState<string | null>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      {/* TOP BAR */}
      <div style={{ background: '#145530' }} className="hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {['(54) 3223-3858', '8h–12h · 13h–17h', 'fgb@basquetegaucho.com.br'].map(t => (
              <span key={t} className="fgb-label" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: 'Facebook',  href: 'https://www.facebook.com/fgb.basquetegaucho' },
              { label: 'Instagram', href: 'https://www.instagram.com/fg_basquete/' },
              { label: 'WhatsApp',  href: 'https://api.whatsapp.com/send?phone=555432233858' },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="fgb-label hover:opacity-100 transition-opacity"
                style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* TRICOLOR STRIPE */}
      <div className="fgb-tricolor" />

      {/* HEADER PRINCIPAL */}
      <header className={`fgb-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-9 h-9">
              <Image
                src="https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png"
                alt="FGB" fill className="object-contain" priority unoptimized
              />
            </div>
            <div className="hidden sm:block">
              <p className="fgb-heading text-white" style={{ fontSize: 13, lineHeight: 1, letterSpacing: '0.04em' }}>
                Federação Gaúcha
              </p>
              <p className="fgb-label" style={{ color: '#F5C200', fontSize: 9, marginTop: 1, letterSpacing: '0.2em' }}>
                de Basketball
              </p>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-stretch h-[60px]">
            {navItems.map(item => (
              <div key={item.label} className="relative flex items-center"
                onMouseEnter={() => item.children && setDropdown(item.label)}
                onMouseLeave={() => setDropdown(null)}>
                <Link href={item.href} className="fgb-nav-item">
                  {item.label}
                  {item.children && (
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${
                      dropdown === item.label ? 'rotate-180' : ''
                    }`} />
                  )}
                </Link>
                {item.children && dropdown === item.label && (
                  <div className="fgb-dropdown">
                    {item.children.map(c => (
                      <Link key={c.href} href={c.href} onClick={() => setDropdown(null)}>{c.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA + MOBILE TOGGLE */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="fgb-btn-primary hidden lg:inline-block">
              Entrar
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 transition-colors"
              style={{ color: 'rgba(255,255,255,0.7)' }}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div style={{ background: '#145530', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="px-4 py-3 space-y-0.5">
              {navItems.map(item => (
                <div key={item.label}>
                  <Link href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 fgb-label hover:opacity-100 transition-opacity"
                    style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                    {item.label}
                  </Link>
                  {item.children?.map(c => (
                    <Link key={c.href} href={c.href}
                      onClick={() => setMobileOpen(false)}
                      className="block pl-7 pr-3 py-2 fgb-label transition-opacity hover:opacity-100"
                      style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Link href="/login" className="fgb-btn-primary block text-center" style={{ color: 'var(--black)' }}>
                  Entrar na Plataforma
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* TICKER VERMELHO */}
      <div className="fgb-ticker">
        <div className="fgb-ticker-track">
          {/* Duplicar 2× para loop infinito */}
          {[1, 2].map(pass => (
            <span key={pass} style={{ display: 'inline-flex', gap: 0 }}>
              <span className="fgb-ticker-item">
                <span className="fgb-badge-live">● AO VIVO</span>
                FGB Season 2026 — Inscrições abertas
                <span className="fgb-ticker-sep">|</span>
              </span>
              <span className="fgb-ticker-item">
                <span className="fgb-badge-novo">NOVO</span>
                Seleção Gaúcha Sub-15 convocada
                <span className="fgb-ticker-sep">|</span>
              </span>
              <span className="fgb-ticker-item">
                <span className="fgb-badge-info">PRAZO</span>
                Inscrições Estadual Feminino — até 31/mar
                <span className="fgb-ticker-sep">|</span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
