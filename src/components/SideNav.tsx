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
    <nav className={cn("w-[240px] bg-black/40 backdrop-blur-2xl border-r border-white/[0.04] saturate-150 flex flex-col relative z-20", className)}>
      {/* Header */}
      <div className="p-6 border-b border-white/[0.04]">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center rounded-[8px] shadow-[0_4px_15px_rgba(234,88,12,0.4)] transition-transform duration-300 group-hover:scale-105 shrink-0">
            <span className="font-display font-black text-white text-[10px] tracking-tight">FGB</span>
          </div>
          <span className="font-display font-black text-white tracking-tight">Sistema</span>
        </Link>
        {teamName && (
          <p className="text-sm font-medium text-slate-400 mt-4 leading-tight">{teamName}</p>
        )}
        {role === "ADMIN" && (
          <Badge variant="blue" size="sm" className="mt-4">
            Administrador
          </Badge>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-300 group border border-transparent",
                isActive
                  ? role === "ADMIN"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] translate-x-1"
                    : "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)] translate-x-1"
                  : "text-slate-500 hover:bg-white/[0.04] hover:border-white/10 hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span className={cn("font-medium text-sm tracking-wide transition-colors", isActive ? "font-semibold" : "")}>
                  {item.label}
                </span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge
                  variant={role === "ADMIN" ? "blue" : "orange"}
                  size="sm"
                  className="shadow-md ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/[0.04] bg-black/20">
        <p className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-[0.2em]">
          FGB App © {new Date().getFullYear()}
        </p>
      </div>
    </nav>
  )
}
