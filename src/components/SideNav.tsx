'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Trophy, Users, Settings,
  Calendar, CalendarDays, BarChart2, Globe, Home, ClipboardList,
  FileText, Bell, MessageSquare, User,
} from 'lucide-react'

type SideNavProps = {
  role?: 'ADMIN' | 'TEAM' | string
  teamName?: string
  className?: string
  onItemClick?: () => void
  width?: number | string
}

const adminNavGroups = [
  {
    label: 'Visao Geral',
    items: [
      { href: '/admin/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
      { href: '/admin/calendario', label: 'Calendario', icon: CalendarDays },
    ],
  },
  {
    label: 'Campeonatos',
    items: [
      { href: '/admin/championships', label: 'Campeonatos', icon: Trophy },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/settings', label: 'Configuracoes', icon: Settings },
    ],
  },
]

const teamNavGroups = [
  {
    label: 'Equipe',
    items: [
      { href: '/team/dashboard',      label: 'Painel',        icon: Home },
      { href: '/team/registrations',  label: 'Inscricoes',    icon: ClipboardList },
      { href: '/team/championships',  label: 'Campeonatos',   icon: Trophy },
      { href: '/team/matches',        label: 'Jogos',         icon: Calendar },
      { href: '/team/standings',      label: 'Classificacao', icon: BarChart2 },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/team/profile',        label: 'Meu Perfil',    icon: User },
      { href: '/team/documents',      label: 'Documentos',    icon: FileText },
      { href: '/team/notifications',  label: 'Notificacoes',  icon: Bell },
      { href: '/team/chat',           label: 'Chat',          icon: MessageSquare },
    ],
  },
]

export function SideNav({ role, teamName, className, onItemClick, width }: SideNavProps) {
  const pathname = usePathname()
  const isTeam = role === 'TEAM'
  const navGroups = isTeam ? teamNavGroups : adminNavGroups
  const label2 = isTeam ? (teamName ?? 'Equipe') : 'Painel de Gestao'
  const label1 = isTeam ? 'FGB Equipe' : 'FGB Admin'

  return (
    <div
      style={{
        background: '#145530',
        width: width ?? 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
      className={className ?? 'hidden md:flex'}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="relative flex-shrink-0" style={{ width: 32, height: 32 }}>
          <Image
            src="https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png"
            alt="FGB"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display,Arial)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#fff', lineHeight: 1 }}>
            {label1}
          </p>
          <p style={{ fontFamily: 'var(--font-display,Arial)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#F5C200', marginTop: 2 }}>
            {label2}
          </p>
        </div>
      </div>

      <div style={{ height: 3, background: 'linear-gradient(to right,#1B7340 33%,#F5C200 33% 66%,#CC1016 66%)', flexShrink: 0 }} />

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {navGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 8 }}>
            <p style={{ fontFamily: 'var(--font-display,Arial)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', padding: '6px 16px 4px' }}>
              {group.label}
            </p>
            {group.items.map(item => {
              const Icon = item.icon
              const active = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    fontFamily: 'var(--font-display,Arial)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: active ? '#F5C200' : 'rgba(255,255,255,0.5)',
                    borderLeft: `3px solid ${active ? '#F5C200' : 'transparent'}`,
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display,Arial)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
        >
          <Globe size={12} />
          Ver site publico
        </a>
      </div>
    </div>
  )
}
