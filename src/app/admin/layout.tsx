import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SideNav, NavItem } from "@/components/SideNav"
import { LayoutDashboard, Trophy, Users, CheckSquare, Cpu, Eye, FileText, Settings } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/login')
  }

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Campeonatos', href: '/admin/championships', icon: Trophy },
    { label: 'Equipes', href: '/admin/teams', icon: Users },
    { label: 'Validação', href: '/admin/validation', icon: CheckSquare },
    { label: 'IA Scheduling', href: '/admin/scheduling', icon: Cpu },
    { label: 'Revisão', href: '/admin/review', icon: Eye },
    { label: 'Relatórios', href: '/admin/reports', icon: FileText },
    { label: 'Configurações', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-[--bg-main]">
      <SideNav items={navItems} role="ADMIN" />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
