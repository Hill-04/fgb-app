'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RegisterResultButton({ gameId }: { gameId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return
    setLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
          status: 'FINISHED'
        })
      })
      if (res.ok) {
        setShowModal(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-[8px] font-black uppercase tracking-widest text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-3 py-1.5 rounded-full hover:bg-[#FF6B00]/20 transition-all shadow-sm"
      >
        + Resultado
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent opacity-50" />
            
            <p className="text-xl font-black italic uppercase text-white tracking-tight mb-8 text-center">
              Registrar Placar
            </p>
            
            <div className="flex items-center gap-6 mb-10">
              <div className="flex-1 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Mandante</p>
                <input
                  type="number"
                  value={homeScore}
                  onChange={e => setHomeScore(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-20 text-4xl font-black text-white text-center focus:outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
              <span className="text-3xl font-black text-slate-700 mt-6 mt-6">×</span>
              <div className="flex-1 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Visitante</p>
                <input
                  type="number"
                  value={awayScore}
                  onChange={e => setAwayScore(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-20 text-4xl font-black text-white text-center focus:outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/[0.03] border border-white/[0.08] rounded-2xl hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest text-white bg-[#FF6B00] hover:bg-[#E66000] rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-orange-600/20 active:scale-95"
              >
                {loading ? 'Salvando...' : 'Confirmar ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
