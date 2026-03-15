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
    <nav className={cn("w-[230px] glass-sidebar flex flex-col relative z-20", className)}>
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <h1 className="text-2xl font-black text-[--text-main] tracking-tight">FGB</h1>
        {teamName && (
          <p className="text-sm font-medium text-[--text-secondary] mt-1">{teamName}</p>
        )}
        {role === "ADMIN" && (
          <Badge variant="blue" size="sm" className="mt-3 bg-[--blue-admin]/30 border-[--blue-admin]/50 font-bold">
            Administrador
          </Badge>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 border border-transparent",
                isActive
                  ? role === "ADMIN"
                    ? "bg-[--blue-admin]/20 text-[--blue-light] border-[--blue-admin]/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] translate-x-1"
                    : "bg-[--orange]/20 text-[--orange] border-[--orange]/30 shadow-[0_0_20px_rgba(249,115,22,0.15)] translate-x-1"
                  : "text-[--text-secondary] hover:bg-white/5 hover:border-white/10 hover:text-[--text-main]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
                <span className="font-semibold text-sm tracking-wide">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge
                  variant={role === "ADMIN" ? "blue" : "orange"}
                  size="sm"
                  className="shadow-lg"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/5">
        <p className="text-xs font-medium text-[--text-dim] text-center uppercase tracking-widest">
          FGB App © 2026
        </p>
      </div>
    </nav>
  )
}
