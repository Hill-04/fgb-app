import Link from 'next/link'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    href: '/team/dashboard',
    label: 'Início',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/team/championships',
    label: 'Campeonatos',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    href: '/team/calendar',
    label: 'Calendário',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function TeamDashboardLayout({ children }: { children: React.ReactNode }) {
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
              <div className="text-[9px] text-orange-500 tracking-widest uppercase mt-0.5 font-bold">Equipe</div>
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
            <span className="font-display font-bold text-xs text-white tracking-widest uppercase">Equipe</span>
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
