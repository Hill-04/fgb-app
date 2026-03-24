'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Calendar, BarChart3, Users, Settings, Sparkles } from 'lucide-react'

interface Tab {
  label: string
  href: string
  icon: React.ElementType
}

export function ChampionshipTabs({ id }: { id: string }) {
  const pathname = usePathname()

  const tabs: Tab[] = [
    { label: 'Visão Geral', href: `/admin/championships/${id}`, icon: Trophy },
    { label: 'Inscrições', href: `/admin/championships/${id}/registrations`, icon: Users },
    { label: 'Organização', href: `/admin/championships/${id}/organization`, icon: Sparkles },
    { label: 'Jogos', href: `/admin/championships/${id}/matches`, icon: Calendar },
    { label: 'Classificação', href: `/admin/championships/${id}/standings`, icon: BarChart3 },
    { label: 'Configurações', href: `/admin/championships/${id}/settings`, icon: Settings },
  ]

  return (
    <div className="flex items-center gap-1 border-b border-white/5 overflow-x-auto shrink-0 no-scrollbar">
      {tabs.map((tab) => {
        const isActive = tab.href === `/admin/championships/${id}`
          ? pathname === tab.href
          : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
              isActive
                ? 'text-[#FF6B00] border-[#FF6B00] bg-[#FF6B00]/5'
                : 'text-slate-500 border-transparent hover:text-white hover:border-white/20'
            }`}
          >
            <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF6B00]' : 'text-slate-500'}`} />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
