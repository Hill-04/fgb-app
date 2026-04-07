import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SideNav } from "@/components/SideNav"
import { AIAssistantBubble } from "@/components/AIAssistantBubble"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any).isAdmin) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative overflow-hidden" style={{ background: 'var(--gray-l)', color: 'var(--black)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <SideNav />
      
      <main className="flex-1 p-4 sm:p-8 md:p-12 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      <AIAssistantBubble />
    </div>
  )
}
