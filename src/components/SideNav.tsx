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
    <nav className={cn("w-[80px] bg-[#060606] border-r border-[rgba(255,255,255,0.05)] flex flex-col relative z-20 items-center py-6", className)}>
      {/* Header */}
      <div className="mb-8 border-b border-[rgba(255,255,255,0.05)] pb-6 w-full flex justify-center">
        <Link href="/" className="inline-flex items-center justify-center group">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#CC5500] flex items-center justify-center rounded-[10px] shadow-[0_4px_10px_rgba(255,107,0,0.2)] transition-transform duration-300 group-hover:scale-110 shrink-0">
            <span className="font-display font-black text-white text-[12px] tracking-tight">FGB</span>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <div className="flex-1 w-full space-y-4 overflow-y-auto overflow-x-hidden flex flex-col items-center">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group relative",
                isActive
                  ? role === "ADMIN"
                    ? "bg-[#3B82F6]/10 text-[#60A5FA] shadow-[0_4px_15px_rgba(59,130,246,0.2)]"
                    : "bg-[#FF6B00]/10 text-[#FF6B00] shadow-[0_4px_15px_rgba(255,107,0,0.2)]"
                  : "text-[--text-secondary] hover:bg-[#111111] hover:text-[--text-main]"
              )}
            >
              <Icon className={cn("w-6 h-6 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
              
              {/* Active Marker Indicator */}
              {isActive && (
                <div className={cn(
                  "absolute -left-3 w-1.5 h-6 rounded-r-full",
                  role === "ADMIN" ? "bg-[#3B82F6]" : "bg-[#FF6B00]"
                )} />
              )}

              {/* Tooltip on hover (large screens) */}
              <div className="absolute left-16 px-3 py-1.5 bg-[#151515] border border-[rgba(255,255,255,0.05)] text-[--text-main] text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                {item.label}
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <div className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white",
                  role === "ADMIN" ? "bg-[#3B82F6]" : "bg-[#FF6B00]"
                )}>
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-[rgba(255,255,255,0.05)] w-full pt-6 flex justify-center">
        <p className="text-[9px] font-bold text-[--text-dim] text-center uppercase tracking-[0.2em] [writing-mode:vertical-rl] rotate-180">
          FGB '26
        </p>
      </div>
    </nav>
  )
}
