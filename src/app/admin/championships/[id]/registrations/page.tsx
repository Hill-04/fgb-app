import { ShieldAlert, Users } from 'lucide-react'

export default function RegistrationsPlaceholder() {
  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-20 text-center relative overflow-hidden">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <Users className="w-16 h-16 text-slate-800 mx-auto mb-6" />
      <h3 className="text-xl font-black text-white mb-2 underline-offset-4 decoration-blue-500">Módulo de Inscrições</h3>
      <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium tracking-tight mb-8">
        A gestão detalhada de equipes, atletas e documentação será implementada na próxima fase.
        Por enquanto, utilize a visão geral para ver o número de confirmados.
      </p>
      <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
        <ShieldAlert className="w-4 h-4" />
        Em Desenvolvimento
      </div>
    </div>
  )
}
