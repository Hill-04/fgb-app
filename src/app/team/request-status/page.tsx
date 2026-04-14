'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Clock, XCircle, CheckCircle, LogOut, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const POLL_INTERVAL_MS = 10_000 // check DB every 10 seconds

export default function RequestStatusPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const membershipStatus = (session?.user as any)?.membershipStatus
  const pendingTeamName = (session?.user as any)?.pendingTeamName
  const pendingTeamId = (session?.user as any)?.pendingTeamId

  // Polls DB and refreshes JWT when status changes
  const checkAndRefresh = async () => {
    try {
      const res = await fetch('/api/team/check-status')
      if (!res.ok) return
      const data = await res.json()
      if (data.membershipStatus !== membershipStatus) {
        // Status changed — refresh the JWT session
        await update()
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (membershipStatus === 'ACTIVE') {
        router.push('/team/dashboard')
        return
      }
      if (membershipStatus === 'NO_TEAM') {
        router.push('/team/onboarding')
        return
      }
    }
  }, [status, membershipStatus, router])

  // Start polling while PENDING
  useEffect(() => {
    if (membershipStatus === 'PENDING') {
      pollerRef.current = setInterval(checkAndRefresh, POLL_INTERVAL_MS)
    }
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membershipStatus])

  const handleManualCheck = async () => {
    setChecking(true)
    await checkAndRefresh()
    setTimeout(() => setChecking(false), 800)
  }

  const handleCancel = async () => {
    if (!pendingTeamId) return
    setCancelling(true)
    setError('')
    try {
      const res = await fetch(`/api/teams/${pendingTeamId}/members/cancel`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao cancelar solicitação')
      }
      // Refresh JWT (trigger='update' re-queries DB; CANCELLED maps to NO_TEAM)
      await update()
      router.push('/team/onboarding')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  const isRejected = membershipStatus === 'REJECTED'

  return (
    <div className="min-h-screen bg-gray-50 text-[var(--black)] flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-[var(--border)] bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center rounded-lg shadow-sm">
            <span className="font-display font-black text-white text-xs tracking-wider">FGB</span>
          </div>
          <div className="leading-none">
            <div className="font-display font-black text-xs text-[var(--black)] tracking-[0.2em] uppercase italic">Federação Gaúcha</div>
            <div className="text-[10px] text-[var(--gray)] font-bold tracking-widest uppercase mt-0.5">de Basquete</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-[var(--gray)] hover:text-[var(--black)] gap-2 text-xs"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[var(--border)] rounded-3xl p-8 shadow-sm">

            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              isRejected
                ? 'bg-red-50 border border-red-100'
                : 'bg-amber-50 border border-amber-100'
            }`}>
              {isRejected
                ? <XCircle className="w-8 h-8 text-red-500" />
                : <Clock className="w-8 h-8 text-amber-500" />
              }
            </div>

            {/* Title */}
            <h1 className="text-2xl font-display font-black uppercase italic text-center mb-2 tracking-tight">
              {isRejected ? 'Solicitação Recusada' : 'Aguardando Aprovação'}
            </h1>

            {/* Team name */}
            {pendingTeamName && (
              <p className="text-center text-[var(--gray)] text-sm mb-6">
                {isRejected ? 'Sua solicitação para ' : 'Você solicitou entrada na equipe '}
                <span className="font-bold text-[var(--black)]">{pendingTeamName}</span>
                {isRejected ? ' foi recusada.' : '.'}
              </p>
            )}

            {/* Status badge */}
            <div className={`rounded-xl p-4 mb-6 ${
              isRejected
                ? 'bg-red-50 border border-red-100'
                : 'bg-amber-50 border border-amber-100'
            }`}>
              {isRejected ? (
                <p className="text-sm text-red-700 text-center">
                  O responsável da equipe não aprovou sua entrada. Você pode tentar entrar em outra equipe ou criar a sua própria.
                </p>
              ) : (
                <div className="text-sm text-amber-700 text-center space-y-1">
                  <p>O responsável da equipe precisa aprovar sua solicitação.</p>
                  <p className="text-[11px] text-amber-600 font-medium">Verificação automática a cada 10 segundos.</p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 text-center mb-4">{error}</p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {isRejected ? (
                <Button
                  onClick={() => router.push('/team/onboarding')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao início
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleManualCheck}
                    disabled={checking}
                    className="w-full border-[var(--border)] text-[var(--black)] hover:bg-gray-50 font-bold gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                    {checking ? 'Verificando...' : 'Verificar aprovação'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {cancelling ? 'Cancelando...' : 'Cancelar solicitação'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
