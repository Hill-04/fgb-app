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
        className="text-[8px] font-black uppercase tracking-widest text-[var(--verde)] bg-[var(--verde)]/10 border border-[var(--verde)]/20 px-3 py-1.5 rounded-full hover:bg-[var(--verde)]/20 transition-all shadow-sm"
      >
        + Resultado
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            {/* FGB tricolor accent bar */}
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(to right,#1B7340 33%,#F5C200 33% 66%,#CC1016 66%)' }} />

            <p className="fgb-display text-xl text-[var(--black)] mb-1 text-center mt-2">
              Registrar Placar
            </p>
            <p className="fgb-label text-[var(--gray)] text-center mb-8" style={{ fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
              Informe os pontos de cada equipe
            </p>

            <div className="flex items-center gap-6 mb-8">
              <div className="flex-1 space-y-2">
                <p className="fgb-label text-[var(--gray)] text-center" style={{ fontSize: 9 }}>Mandante</p>
                <input
                  type="number"
                  value={homeScore}
                  onChange={e => setHomeScore(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[var(--gray-l)] border border-[var(--border)] rounded-xl h-20 text-4xl font-black text-[var(--black)] text-center focus:outline-none focus:border-[var(--verde)] focus:ring-1 focus:ring-[var(--verde)] transition-all font-sans"
                />
              </div>
              <span className="text-2xl font-black text-[var(--gray)] mt-6">×</span>
              <div className="flex-1 space-y-2">
                <p className="fgb-label text-[var(--gray)] text-center" style={{ fontSize: 9 }}>Visitante</p>
                <input
                  type="number"
                  value={awayScore}
                  onChange={e => setAwayScore(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[var(--gray-l)] border border-[var(--border)] rounded-xl h-20 text-4xl font-black text-[var(--black)] text-center focus:outline-none focus:border-[var(--verde)] focus:ring-1 focus:ring-[var(--verde)] transition-all font-sans"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] bg-[var(--gray-l)] border border-[var(--border)] rounded-xl hover:border-[var(--black)] hover:text-[var(--black)] transition-all font-sans"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-[var(--black)] bg-[var(--yellow)] hover:bg-[var(--yellow)]/80 rounded-xl transition-all disabled:opacity-50 shadow-sm active:scale-95 font-sans"
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
