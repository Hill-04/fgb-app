import Link from 'next/link'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    href: '/admin/dashboard',
    label: 'Visão Geral',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: '/admin/teams',
    label: 'Equipes',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/championships',
    label: 'Campeonatos',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    href: '/admin/scheduling',
    label: 'Gerador IA',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    badge: 'IA',
  },
  {
    href: '/admin/reports',
    label: 'Relatórios',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060810] text-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-white/[0.06] bg-[#060810] hidden md:flex flex-col">
        {/* Logo area */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 flex items-center justify-center rotate-45 shrink-0">
              <span className="font-display font-black text-white text-[10px] -rotate-45 tracking-tight">FGB</span>
            </div>
            <div className="leading-none min-w-0">
              <div className="font-display font-bold text-[11px] text-white tracking-[0.18em] uppercase truncate">
                Federação Gaúcha
              </div>
              <div className="text-[9px] text-orange-500 tracking-widest uppercase mt-0.5 font-bold">Admin</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[9px] font-black text-slate-700 tracking-[0.25em] uppercase px-3 mb-3">Menu</p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all border-l-2 border-l-transparent hover:border-l-orange-500"
            >
              <span className="text-slate-600 group-hover:text-orange-500 transition-colors">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-black bg-orange-500/20 text-orange-400 px-1.5 py-0.5 tracking-widest">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-400 hover:bg-white/[0.03] transition-all"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 border-b border-white/[0.06] bg-[#060810]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-600 flex items-center justify-center rotate-45 shrink-0">
              <span className="font-display font-black text-white text-[9px] -rotate-45">FGB</span>
            </div>
            <span className="font-display font-bold text-xs text-white tracking-widest uppercase">Admin</span>
          </div>
          <Button variant="outline" size="sm" className="bg-transparent border-white/[0.08] text-slate-400 rounded-none text-xs">
            Menu
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-5 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
