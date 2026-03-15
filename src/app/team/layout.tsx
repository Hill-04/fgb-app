import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SideNav } from "@/components/SideNav"

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== 'TEAM') {
    redirect('/login')
  }

  const teamName = (session.user as any).teamName || 'Equipe'

  return (
    <div className="flex min-h-screen bg-[--bg-main]">
      <SideNav role="TEAM" teamName={teamName} />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
