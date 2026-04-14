import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SideNav } from "@/components/SideNav"
import { MobileHeader } from "@/components/MobileHeader"
import { AIAssistantBubble } from "@/components/AIAssistantBubble"

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  // Middleware já garante autenticação e membershipStatus=ACTIVE para rotas protegidas.
  // Este check serve como fallback de segurança para SSR.
  if (!session) {
    redirect('/login')
  }

  const membershipStatus = (session.user as any).membershipStatus
  const isAdmin = (session.user as any).isAdmin

  if (isAdmin) {
    redirect('/admin/dashboard')
  }

  // Rotas públicas do portal (onboarding, create, join, request-status) não usam este layout.
  // Aqui só chegam rotas do portal da equipe — exige membership ACTIVE.
  if (membershipStatus !== 'ACTIVE') {
    if (membershipStatus === 'PENDING') {
      redirect('/team/request-status')
    }
    redirect('/team/onboarding')
  }

  const teamName = (session.user as any).teamName || 'Equipe'

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-[var(--black)] selection:bg-orange-500/20 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <MobileHeader role="TEAM" teamName={teamName} />
      <SideNav role="TEAM" teamName={teamName} className="hidden md:flex shrink-0" />
      <main className="flex-1 p-4 sm:p-8 md:p-12 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      <AIAssistantBubble />
    </div>
  )
}
