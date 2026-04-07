"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ChevronDown, Menu, X, Phone, Clock, Mail } from 'lucide-react'

const FGB_LOGO = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'

const fgbLinks = [
  { label: 'Diretoria', href: '/fgb/diretoria' },
  { label: 'Fundação', href: '/fgb/fundacao' },
  { label: 'Quadro de Honra', href: '/fgb/quadro-de-honra' },
  { label: 'História da Federação', href: '/fgb/historia' },
  { label: 'Regulamento Desportivo', href: '/fgb/regulamento' },
  { label: 'Categorias e Idades', href: '/fgb/categorias' },
  { label: 'Notas Oficiais', href: '/fgb/notas' },
  { label: 'Arbitragem', href: '/fgb/arbitragem' },
]

const campLinks = [
  { label: 'Todos os Campeonatos', href: '/campeonatos' },
  { label: 'Estadual Feminino', href: '/campeonatos?filtro=feminino' },
  { label: 'Estadual Masculino', href: '/campeonatos?filtro=masculino' },
  { label: 'Cestinhas', href: '/campeonatos/cestinhas' },
  { label: 'Normas do Estadual', href: '/fgb/regulamento' },
]

function DropdownMenu({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
        onClick={() => setOpen(!open)}
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-[#141414] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-xs text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all border-b border-white/[0.04] last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* TOP BAR */}
      <div className="bg-[#0A0A0A] border-b border-white/[0.05] py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6 text-[10px] text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <Phone className="w-2.5 h-2.5" />
              (54) 3223-3858
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-2.5 h-2.5" />
              8h às 12h · 13h às 17h
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-2.5 h-2.5" />
              fgb@basquetegaucho.com.br
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/fgb.basquetegaucho"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-[#FF6B00] transition-colors text-[10px] uppercase tracking-widest"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/fg_basquete/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-[#FF6B00] transition-colors text-[10px] uppercase tracking-widest"
            >
              Instagram
            </a>
            <a
              href="https://api.whatsapp.com/send?phone=555432233858&text=Olá!%20Tudo%20Bem?"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-[#FF6B00] transition-colors text-[10px] uppercase tracking-widest"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header className="bg-[#0D0D0D] border-b border-white/[0.08] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo + Nome */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src={FGB_LOGO}
                alt="FGB - Federação Gaúcha de Basketball"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-black text-sm uppercase tracking-tight leading-none">
                Federação Gaúcha
              </p>
              <p className="text-[10px] text-[#FF6B00] uppercase tracking-[0.2em] mt-0.5">
                de Basketball
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              Início
            </Link>
            <DropdownMenu label="FGB" items={fgbLinks} />
            <DropdownMenu label="Campeonatos" items={campLinks} />
            <Link
              href="/selecao-gaucha"
              className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              Seleção Gaúcha
            </Link>
            <Link
              href="/galeria"
              className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              Destaques
            </Link>
            <Link
              href="/login"
              className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all"
            >
              Entrar
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/[0.06] bg-[#0D0D0D] px-6 py-4 space-y-3">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white py-2">Início</Link>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 pt-2">FGB</div>
            {fgbLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block text-xs text-slate-400 hover:text-white py-1.5 pl-3">{l.label}</Link>
            ))}
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 pt-2">Campeonatos</div>
            {campLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block text-xs text-slate-400 hover:text-white py-1.5 pl-3">{l.label}</Link>
            ))}
            <Link href="/selecao-gaucha" onClick={() => setMobileOpen(false)} className="block text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white py-2">Seleção Gaúcha</Link>
            <Link href="/galeria" onClick={() => setMobileOpen(false)} className="block text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white py-2">Destaques</Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-xl transition-all text-center mt-2"
            >
              Entrar
            </Link>
          </div>
        )}
      </header>
    </>
  )
}
