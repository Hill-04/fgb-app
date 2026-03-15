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
    <nav className={cn("w-[240px] glass-sidebar flex flex-col relative z-20", className)}>
      {/* Header */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.1)]">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B00] to-[#CC5500] flex items-center justify-center rounded-[8px] shadow-[0_4px_10px_rgba(255,107,0,0.2)] transition-transform duration-300 group-hover:scale-105 shrink-0">
            <span className="font-display font-black text-white text-[10px] tracking-tight">FGB</span>
          </div>
          <span className="font-display font-black text-[--text-main] tracking-tight">Sistema</span>
        </Link>
        {teamName && (
          <p className="text-sm font-bold text-[--text-secondary] mt-4 leading-tight">{teamName}</p>
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
                    ? "bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/20 shadow-sm translate-x-1"
                    : "bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20 shadow-sm translate-x-1"
                  : "text-[--text-secondary] hover:bg-white/5 hover:border-[rgba(255,255,255,0.1)] hover:text-[--text-main]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span className={cn("font-medium text-sm tracking-wide transition-colors", isActive ? "font-bold" : "")}>
                  {item.label}
                </span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge
                  variant={role === "ADMIN" ? "blue" : "orange"}
                  size="sm"
                  className="shadow-sm ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[rgba(255,255,255,0.1)] bg-white/5">
        <p className="text-[10px] font-bold text-[--text-dim] text-center uppercase tracking-[0.2em]">
          FGB App © {new Date().getFullYear()}
        </p>
      </div>
    </nav>
  )
}
