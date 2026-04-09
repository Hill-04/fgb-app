import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SideNav } from "@/components/SideNav"
import { MobileHeader } from "@/components/MobileHeader"
import { AIAssistantBubble } from "@/components/AIAssistantBubble"
import { ensureDatabaseSchema } from "@/lib/db-patch"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any).isAdmin) {
    redirect('/login')
  }

  await ensureDatabaseSchema()

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-admin)', color: 'var(--black)' }}>
      {/* Background decoration - subtle patterns for Premium feel */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--verde)]/5 blur-[120px] rounded-full -mr-[200px] -mt-[200px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--red)]/5 blur-[100px] rounded-full -ml-[150px] -mb-[150px]" />
      </div>

      <MobileHeader role="ADMIN" />
      <SideNav className="hidden md:flex shrink-0" />
      
      <main className="flex-1 p-4 sm:p-8 md:p-12 lg:p-16 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
      <AIAssistantBubble />
    </div>
  )
}
