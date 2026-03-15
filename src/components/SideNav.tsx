"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "./Badge"
import { 
  LayoutDashboard, Trophy, Users, Cpu, FileText, 
  Home, Calendar, BarChart3, Bell, MessageSquare, ClipboardList 
} from "lucide-react"

type SideNavProps = {
  role: "TEAM" | "ADMIN"
  teamName?: string
  className?: string
}

export type NavItem = {
  label: string
  href: string
  icon: any
  badge?: number
}

export function SideNav({ role, teamName, className }: SideNavProps) {
  const pathname = usePathname()

  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Campeonatos', href: '/admin/championships', icon: Trophy },
    { label: 'Usuários', href: '/admin/users', icon: Users },
    { label: 'Equipes', href: '/admin/teams', icon: Users },
    { label: 'IA Scheduling', href: '/admin/scheduling', icon: Cpu },
    { label: 'Relatórios', href: '/admin/reports', icon: FileText },
  ]

  const teamNavItems: NavItem[] = [
    { label: 'Início', href: '/team/dashboard', icon: Home },
    { label: 'Campeonatos', href: '/team/championships', icon: Trophy },
    { label: 'Calendário', href: '/team/calendar', icon: Calendar },
    { label: 'Classificação', href: '/team/standings', icon: BarChart3 },
    { label: 'Resultados', href: '/team/results', icon: ClipboardList },
    { label: 'Documentos', href: '/team/documents', icon: FileText },
    { label: 'Notificações', href: '/team/notifications', icon: Bell, badge: 0 },
    { label: 'Chat FGB', href: '/team/chat', icon: MessageSquare },
  ]

  const items = role === "ADMIN" ? adminNavItems : teamNavItems

  return (
    <nav className={cn("w-[230px] bg-[--bg-sidebar] border-r border-[--border-color] flex flex-col", className)}>
      {/* Header */}
      <div className="p-6 border-b border-[--border-color]">
        <h1 className="text-xl font-bold text-[--text-main]">FGB</h1>
        {teamName && (
          <p className="text-sm text-[--text-secondary] mt-1">{teamName}</p>
        )}
        {role === "ADMIN" && (
          <Badge variant="blue" size="sm" className="mt-2">Administrador</Badge>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? role === "ADMIN"
                    ? "bg-[--blue-admin]/20 text-[--blue-light] border border-[--blue-admin]/30"
                    : "bg-[--orange]/20 text-[--orange] border border-[--orange]/30"
                  : "text-[--text-secondary] hover:bg-[--border-color]/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge
                  variant={role === "ADMIN" ? "blue" : "orange"}
                  size="sm"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[--border-color]">
        <p className="text-xs text-[--text-dim] text-center">
          FGB App © 2026
        </p>
      </div>
    </nav>
  )
}
