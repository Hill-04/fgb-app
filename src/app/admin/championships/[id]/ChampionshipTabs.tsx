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
  DRAFT: 'Criacao',
  REGISTRATION_OPEN: 'Inscricoes',
  REGISTRATION_CLOSED: 'Inscricoes',
  ORGANIZING: 'Organizacao',
  ONGOING: 'Em andamento',
  ACTIVE: 'Em andamento',
  FINISHED: 'Encerrado',
}

export function ChampionshipTabs({ id, status }: { id: string; status: string }) {
  const pathname = usePathname()

  const tabs: Tab[] = [
    {
      label: 'Visao Geral',
      href: `/admin/championships/${id}`,
      icon: LayoutDashboard,
      alwaysActive: true,
    },
    {
      label: 'Inscricoes',
      href: `/admin/championships/${id}/registrations`,
      icon: Users,
      alwaysActive: true,
    },
    {
      label: 'Organizacao',
      href: `/admin/championships/${id}/organization`,
      icon: Sparkles,
      alwaysActive: true,
      badge: 'IA',
    },
    {
      label: 'Jogos',
      href: `/admin/championships/${id}/jogos`,
      icon: Calendar,
      requiresStatus: ['ORGANIZING', 'ONGOING', 'ACTIVE', 'FINISHED'],
    },
    {
      label: 'Classificacao',
      href: `/admin/championships/${id}/standings`,
      icon: BarChart2,
      requiresStatus: ['ONGOING', 'ACTIVE', 'FINISHED'],
    },
    {
      label: 'Rankings',
      href: `/admin/championships/${id}/cestinhas`,
      icon: BarChart2,
      requiresStatus: ['ONGOING', 'ACTIVE', 'FINISHED'],
    },
    {
      label: 'Arbitragem',
      href: `/admin/championships/${id}/arbitragem`,
      icon: FileText,
      alwaysActive: true,
    },
    {
      label: 'Relatorios',
      href: `/admin/championships/${id}/relatorios`,
      icon: FileText,
      alwaysActive: true,
    },
    {
      label: 'Configuracoes',
      href: `/admin/championships/${id}/settings`,
      icon: Settings,
      alwaysActive: true,
    },
  ]

  return (
    <div className="flex items-center gap-0 shrink-0 overflow-x-auto border-b border-[var(--border)] bg-white no-scrollbar">
      {tabs.map((tab, index) => {
        const isActive =
          tab.href === `/admin/championships/${id}` ? pathname === tab.href : pathname.startsWith(tab.href)

        const isEnabled = tab.alwaysActive || !tab.requiresStatus || tab.requiresStatus.includes(status)
        const previousLabel = tabs[Math.max(0, index - 1)]?.label
        const reasonLabel = statusLabels[status] || 'a etapa anterior'
        const disabledTitle = previousLabel
          ? `Esta aba estara disponivel apos ${previousLabel}.`
          : `Esta aba estara disponivel apos ${reasonLabel}.`

        return (
          <Link
            key={tab.href}
            href={isEnabled ? tab.href : pathname || '#'}
            onClick={(event) => {
              if (!isEnabled) event.preventDefault()
            }}
            aria-disabled={!isEnabled}
            title={!isEnabled ? disabledTitle : undefined}
            className={`group flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              isActive
                ? 'border-[var(--verde)] bg-[var(--verde)]/5 text-[var(--verde)]'
                : 'border-transparent text-[var(--gray)] hover:border-[var(--border)] hover:text-[var(--black)]'
            } ${!isEnabled ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            <tab.icon className={`h-3.5 w-3.5 ${isActive ? 'text-[var(--verde)]' : 'text-[var(--gray)]'}`} />
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
