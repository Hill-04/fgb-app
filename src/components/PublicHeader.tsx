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
      { label: 'História', href: '/fgb/historia' },
      { label: 'Categorias e Idades', href: '/fgb/categorias' },
      { label: 'Regulamento', href: '/fgb/regulamento' },
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
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* TOP BAR */}
      <div className="bg-[#070707] border-b border-white/[0.04] py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6 text-[9px] text-slate-600 uppercase tracking-[0.15em]">
            <span>(54) 3223-3858</span>
            <span className="text-slate-700">·</span>
            <span>8h às 12h · 13h às 17h</span>
            <span className="text-slate-700">·</span>
            <span>fgb@basquetegaucho.com.br</span>
          </div>
          <div className="flex items-center gap-5">
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
                className="text-[9px] uppercase tracking-[0.15em] text-slate-600 hover:text-[#FF6B00] transition-colors duration-200"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
            : 'bg-[#0D0D0D] border-b border-white/[0.06]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex-shrink-0">
              <Image
                src={FGB_LOGO}
                alt="FGB - Federação Gaúcha de Basketball"
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-black text-[13px] uppercase tracking-tight leading-none">
                Federação Gaúcha
              </p>
              <p className="text-[9px] text-[#FF6B00] uppercase tracking-[0.25em] mt-0.5 font-bold">
                de Basketball · FGB
              </p>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-200 ${
                    activeDropdown === item.label
                      ? 'text-white bg-white/[0.06]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        activeDropdown === item.label ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </Link>

                {/* DROPDOWN */}
                {item.children && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-[#141414] border border-white/[0.1] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50">
                    {/* Borda laranja no topo */}
                    <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#FF6B00]/40 to-transparent" />
                    <div className="p-1.5 pt-2.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all duration-150"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* CTA ENTRAR */}
            <Link
              href="/login"
              className="ml-3 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[11px] uppercase tracking-[0.1em] px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.03] shadow-[0_4px_15px_rgba(255,107,0,0.3)] hover:shadow-[0_6px_25px_rgba(255,107,0,0.45)]"
            >
              Entrar
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-2"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#0D0D0D] border-t border-white/[0.06] px-4 pb-4">
            <div className="space-y-1 pt-3">
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 text-[11px] font-black uppercase tracking-wide text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all"
                  >
                    {item.label}
                  </Link>
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block pl-6 pr-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:text-slate-300 hover:bg-white/[0.03] rounded-xl transition-all"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-3 border-t border-white/[0.06]">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[11px] uppercase tracking-wide px-5 py-3 rounded-xl transition-all"
                >
                  Entrar na Plataforma
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
