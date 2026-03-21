"use client"

import { use } from 'react'
import { Settings, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ChampionshipSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <Settings className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Preferências Gerais</h2>
              <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-0.5">Configurações Básicas do Campeonato</p>
            </div>
          </div>
          <Button variant="outline" className="h-10 border-white/10 hover:bg-white/5 uppercase text-xs font-black tracking-widest rounded-xl text-white">
             <Edit3 className="w-4 h-4 mr-2" /> Editar Campeonato
          </Button>
        </div>
        <div className="p-10 text-center">
            <p className="text-xs font-medium text-slate-600 italic">Mais configurações (regras, categorias, pontuação) serão adicionadas aqui.</p>
        </div>
      </div>
    </div>
  )
}
