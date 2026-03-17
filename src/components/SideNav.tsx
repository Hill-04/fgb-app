"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "./Badge"
import { 
  LayoutDashboard, Trophy, Users, Cpu, FileText, 
  Home, Calendar, BarChart3, Bell, MessageSquare, ClipboardList,
  ChevronLeft, ChevronRight, Shield, FlaskConical
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
  const [isCollapsed, setIsCollapsed] = useState(false)

  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Campeonatos', href: '/admin/championships', icon: Trophy },
    { label: 'Resultados', href: '/admin/results', icon: ClipboardList },
    { label: 'Classificação', href: '/admin/standings', icon: BarChart3 },
    { label: 'Jogos', href: '/admin/games', icon: Calendar },
    { label: 'Usuários', href: '/admin/users', icon: Users },
    { label: 'Equipes', href: '/admin/teams', icon: Shield },
    { label: 'Calendário IA', href: '/admin/scheduling', icon: Cpu },
    { label: 'Relatórios', href: '/admin/reports', icon: FileText },
    { label: 'Simulação', href: '/admin/simulation', icon: FlaskConical },
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
    <nav className={cn(
      "bg-[#060606] border-r border-[rgba(255,255,255,0.05)] flex flex-col relative z-20 items-center py-6 transition-all duration-300", 
      isCollapsed ? "w-[80px]" : "w-[240px] items-start px-4",
      className
    )}>
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-[#FF6B00]/50 transition-all z-30 shadow-lg"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Header */}
      <div className={cn("mb-8 border-b border-[rgba(255,255,255,0.05)] pb-6 w-full flex", isCollapsed ? "justify-center" : "justify-start px-2")}>
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#CC5500] flex items-center justify-center rounded-[10px] shadow-[0_4px_10px_rgba(255,107,0,0.2)] transition-transform duration-300 group-hover:scale-110 shrink-0">
            <span className="font-display font-black text-white text-[12px] tracking-tight">FGB</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-display font-black text-white text-xs tracking-wider uppercase leading-none">Federação</span>
              <span className="font-display font-medium text-[#FF6B00] text-[8px] tracking-[0.2em] uppercase mt-0.5 whitespace-nowrap">Gaúcha de Basquete</span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <div className={cn("flex-1 w-full space-y-2 overflow-y-auto overflow-x-hidden flex flex-col", isCollapsed ? "items-center" : "items-stretch px-2")}>
        <div className={cn("text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 px-3", isCollapsed && "hidden")}>
          Menu Principal
        </div>
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : ""}
              className={cn(
                "flex items-center rounded-xl transition-all duration-300 group relative",
                isCollapsed ? "w-12 h-12 justify-center" : "w-full h-11 px-3 gap-3",
                isActive
                  ? role === "ADMIN"
                    ? "bg-[#3B82F6]/10 text-[#60A5FA] shadow-[0_4px_15px_rgba(59,130,246,0.1)]"
                    : "bg-[#FF6B00]/10 text-[#FF6B00] shadow-[0_4px_15px_rgba(255,107,0,0.1)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
              
              {!isCollapsed && (
                <span className={cn("text-xs font-bold tracking-wide", isActive ? "text-white" : "text-inherit")}>
                  {item.label}
                </span>
              )}

              {/* Active Marker Indicator */}
              {isActive && (
                <div className={cn(
                  "absolute h-5 w-1 rounded-full",
                  isCollapsed ? "-left-1" : "-left-4",
                  role === "ADMIN" ? "bg-[#3B82F6]" : "bg-[#FF6B00]"
                )} />
              )}

              {/* Tooltip on hover (only when collapsed) */}
              {isCollapsed && (
                <div className="absolute left-16 px-3 py-1.5 bg-[#151515] border border-[rgba(255,255,255,0.05)] text-[--text-main] text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </div>
              )}

              {item.badge !== undefined && item.badge > 0 && (
                <div className={cn(
                  "absolute w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white",
                  isCollapsed ? "-top-1 -right-1" : "right-3",
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
      {!isCollapsed && (
        <div className="mt-8 border-t border-[rgba(255,255,255,0.05)] w-full pt-6 px-4">
           <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-white tracking-tight leading-none mb-1">FGB SEASON '26</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Beta Access</p>
           </div>
        </div>
      )}
      
      {isCollapsed && (
        <div className="mt-8 border-t border-[rgba(255,255,255,0.05)] w-full pt-6 flex justify-center">
          <p className="text-[9px] font-bold text-[--text-dim] text-center uppercase tracking-[0.2em] [writing-mode:vertical-rl] rotate-180">
            FGB '26
          </p>
        </div>
      )}
    </nav>
  )
}
