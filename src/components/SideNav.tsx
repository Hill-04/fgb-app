"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "./Badge"
import { LucideIcon } from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

type SideNavProps = {
  items: NavItem[]
  role: "TEAM" | "ADMIN"
  teamName?: string
  className?: string
}

export function SideNav({ items, role, teamName, className }: SideNavProps) {
  const pathname = usePathname()

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
              {item.badge && item.badge > 0 && (
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
