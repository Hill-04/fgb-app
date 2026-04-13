'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Calendar, FileText, LayoutDashboard, Settings, Sparkles, Users } from 'lucide-react'

interface Tab {
  label: string
  href: string
  icon: React.ElementType
  alwaysActive?: boolean
  requiresStatus?: string[]
  badge?: string
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Criação',
  REGISTRATION_OPEN: 'Inscrições',
  REGISTRATION_CLOSED: 'Inscrições',
  ORGANIZING: 'Organização',
  ONGOING: 'Em andamento',
  ACTIVE: 'Em andamento',
  FINISHED: 'Encerrado',
}

export function ChampionshipTabs({ id, status }: { id: string; status: string }) {
  const pathname = usePathname()

  const tabs: Tab[] = [
    {
      label: 'Visão Geral',
      href: `/admin/championships/${id}`,
      icon: LayoutDashboard,
      alwaysActive: true,
    },
    {
      label: 'Configurações',
      href: `/admin/championships/${id}/settings`,
      icon: Settings,
      alwaysActive: true,
    },
    {
      label: 'Inscrições',
      href: `/admin/championships/${id}/registrations`,
      icon: Users,
      alwaysActive: true,
    },
    {
      label: 'Organizar IA',
      href: `/admin/championships/${id}/organization`,
      icon: Sparkles,
      alwaysActive: true,
      badge: 'IA',
    },
    {
      label: 'Jogos',
      href: `/admin/championships/${id}/matches`,
      icon: Calendar,
      requiresStatus: ['ORGANIZING', 'ONGOING', 'ACTIVE', 'FINISHED'],
    },
    {
      label: 'Classificação',
      href: `/admin/championships/${id}/standings`,
      icon: BarChart2,
      requiresStatus: ['ONGOING', 'ACTIVE', 'FINISHED'],
    },
    {
      label: 'Documentos',
      href: `/admin/championships/${id}/documents`,
      icon: FileText,
      alwaysActive: true,
    },
  ]

  return (
    <div className="flex items-center gap-0 border-b border-[var(--border)] overflow-x-auto shrink-0 no-scrollbar bg-white">
      {tabs.map((tab, index) => {
        const isActive = tab.href === `/admin/championships/${id}`
          ? pathname === tab.href
          : pathname.startsWith(tab.href)

        const isEnabled = tab.alwaysActive || !tab.requiresStatus || tab.requiresStatus.includes(status)
        const previousLabel = tabs[Math.max(0, index - 1)]?.label
        const reasonLabel = statusLabels[status] || 'a etapa anterior'
        const disabledTitle = previousLabel
          ? `Esta aba estará disponível após ${previousLabel}.`
          : `Esta aba estará disponível após ${reasonLabel}.`

        return (
          <Link
            key={tab.href}
            href={isEnabled ? tab.href : pathname || '#'}
            onClick={(event) => {
              if (!isEnabled) event.preventDefault()
            }}
            aria-disabled={!isEnabled}
            title={!isEnabled ? disabledTitle : undefined}
            className={`group flex items-center gap-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
              isActive
                ? 'text-[var(--verde)] border-[var(--verde)] bg-[var(--verde)]/5'
                : 'text-[var(--gray)] border-transparent hover:text-[var(--black)] hover:border-[var(--border)]'
            } ${!isEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--verde)]' : 'text-[var(--gray)]'}`} />
            {tab.label}
            {tab.badge && (
              <span className="ml-1 rounded-full bg-[var(--verde)]/10 px-2 py-0.5 text-[9px] font-black text-[var(--verde)]">
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
