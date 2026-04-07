"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, Trophy, Users, FileText, 
  Home, Calendar, BarChart3, Bell, MessageSquare,
  ChevronLeft, ChevronRight, Shield, FlaskConical
} from "lucide-react"

type SideNavProps = {
  role: "TEAM" | "ADMIN"
  teamName?: string
  className?: string
  onItemClick?: () => void
}

export type NavItem = {
  label: string
  href: string
  icon: any
  badge?: number
}

export type NavSection = {
  title: string
  items: NavItem[]
}

export function SideNav({ role, teamName, className, onItemClick }: SideNavProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const adminSections: NavSection[] = [
    {
      title: "FEDERAÇÃO",
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Campeonatos', href: '/admin/championships', icon: Trophy },
      ]
    },
    {
      title: "GESTÃO",
      items: [
        { label: 'Equipes', href: '/admin/teams', icon: Shield },
        { label: 'Usuários', href: '/admin/users', icon: Users },
        { label: 'Relatórios', href: '/admin/reports', icon: FileText },
      ]
    },
    {
      title: "FERRAMENTAS",
      items: [
        { label: 'Simulação', href: '/admin/simulation', icon: FlaskConical },
      ]
    },
  ]

  const teamSections: NavSection[] = [
    {
      title: "MEU TIME",
      items: [
        { label: 'Dashboard', href: '/team/dashboard', icon: Home },
        { label: 'Meus Jogos', href: '/team/matches', icon: Calendar },
        { label: 'Documentação', href: '/team/documents', icon: FileText },
      ]
    },
    {
      title: "COMPETIÇÃO",
      items: [
        { label: 'Campeonatos', href: '/team/championships', icon: Trophy },
        { label: 'Classificação', href: '/team/standings', icon: BarChart3 },
      ]
    },
    {
      title: "COMUNICAÇÃO",
      items: [
        { label: 'Notificações', href: '/team/notifications', icon: Bell },
        { label: 'Chat FGB', href: '/team/chat', icon: MessageSquare },
      ]
    }
  ]

  const sections = role === "ADMIN" ? adminSections : teamSections

  return (
    <nav className={cn(
      "bg-[#060606] border-r border-[rgba(255,255,255,0.05)] flex flex-col relative z-20 items-center py-6 transition-all duration-300 h-full", 
      isCollapsed ? "w-[80px]" : "w-[240px] items-start px-4",
      className
    )}>
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#111] border border-white/10 rounded-full hidden md:flex items-center justify-center text-slate-400 hover:text-white hover:border-[#FF6B00]/50 transition-all z-30 shadow-lg"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Header */}
      <div className={cn("mb-8 border-b border-[rgba(255,255,255,0.05)] pb-6 w-full hidden md:flex", isCollapsed ? "justify-center" : "justify-start px-2")}>
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#CC5500] flex items-center justify-center rounded-[10px] shadow-[0_4px_10px_rgba(255,107,0,0.2)] shrink-0">
            <span className="font-display font-black text-white text-[12px]">FGB</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-display font-black text-white text-xs tracking-wider uppercase leading-none">Federação</span>
              <span className="font-display font-medium text-[#FF6B00] text-[8px] tracking-[0.2em] uppercase mt-0.5 whitespace-nowrap">Gaúcha de Basquete</span>
            </div>
          )}
        </Link>
      </div>

      {/* Sections & Items */}
      <div className={cn("flex-1 w-full space-y-6 overflow-y-auto overflow-x-hidden no-scrollbar", isCollapsed ? "items-center" : "items-stretch px-2")}>
        {sections.map((section, sidx) => (
          <div key={sidx} className="space-y-1">
            {!isCollapsed && (
              <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 px-3 opacity-50">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onItemClick && onItemClick()}
                  className={cn(
                    "flex items-center rounded-xl transition-all duration-300 group relative",
                    isCollapsed ? "w-12 h-12 justify-center mx-auto" : "w-full h-10 px-3 gap-3",
                    isActive
                      ? "bg-white/5 text-white shadow-sm"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                  )}
                >
                  <Icon className={cn("w-4.5 h-4.5 transition-transform", isActive ? "text-[#FF6B00] scale-110" : "group-hover:scale-110")} />
                  
                  {!isCollapsed && (
                    <span className={cn("text-[11px] font-bold tracking-tight", isActive ? "text-white" : "text-inherit")}>
                      {item.label}
                    </span>
                  )}

                  {/* Active Indicator */}
                  {isActive && !isCollapsed && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_8px_rgba(255,107,0,0.5)]" />
                  )}

                  {/* Tooltip (only when collapsed) */}
                  {isCollapsed && (
                    <div className="absolute left-16 px-3 py-1.5 bg-[#151515] border border-white/10 text-white text-[10px] font-black rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      {!isCollapsed ? (
        <div className="mt-8 border-t border-white/5 w-full pt-6 px-4">
           <div className="bg-white/chan05 p-3 rounded-2xl border border-white/chan05 mb-3">
              <p className="text-[10px] font-black text-white tracking-tight leading-none mb-1">FGB SEASON '26</p>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none">Beta Access</p>
           </div>
           <a
             href="/"
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-[#FF6B00] transition-colors py-1"
           >
             <span>🌐</span>
             Ver site público
           </a>
        </div>
      ) : (
        <div className="mt-8 border-t border-white/5 w-full pt-6 flex justify-center">
          <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em] [writing-mode:vertical-rl] rotate-180">
            FGB '26
          </p>
        </div>
      )}
    </nav>
  )
}
