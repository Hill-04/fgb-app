'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Calendar, BarChart3, Users, Settings, Sparkles, GitBranch } from 'lucide-react'

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
    { label: 'Chaveamento', href: `/admin/championships/${id}/bracket`, icon: GitBranch },
    { label: 'Classificação', href: `/admin/championships/${id}/standings`, icon: BarChart3 },
    { label: 'Cestinhas (MVP)', href: `/admin/championships/${id}/cestinhas`, icon: Trophy },
    { label: 'Configurações', href: `/admin/championships/${id}/settings`, icon: Settings },
  ]

  return (
    <div className="flex items-center gap-0 border-b border-[var(--border)] overflow-x-auto shrink-0 no-scrollbar bg-white">
      {tabs.map((tab) => {
        const isActive = tab.href === `/admin/championships/${id}`
          ? pathname === tab.href
          : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
              isActive
                ? 'text-[var(--verde)] border-[var(--verde)] bg-[var(--verde)]/5'
                : 'text-[var(--gray)] border-transparent hover:text-[var(--black)] hover:border-[var(--border)]'
            }`}
          >
            <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--verde)]' : 'text-[var(--gray)]'}`} />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
