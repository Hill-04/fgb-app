import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SideNav } from "@/components/SideNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any).isAdmin) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-black text-slate-50 selection:bg-blue-500/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/[0.05] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-600/[0.03] blur-[120px] rounded-full" />
      </div>

      <SideNav role="ADMIN" className="shrink-0" />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
