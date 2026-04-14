'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Users, CheckCircle2, XCircle, Clock, Shield, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  userId: string
  role: string
  status: string
  requestedAt: string
  approvedAt: string | null
  user: {
    id: string
    name: string
    email: string
    createdAt: string
  }
}

const ROLE_LABELS: Record<string, string> = {
  HEAD_COACH: 'Head Coach',
  ASSISTANT_COACH: 'Assistente Técnico',
  STAFF_PHYSIO: 'Fisioterapeuta',
  STAFF_MANAGER: 'Manager',
  STAFF_OTHER: 'Staff',
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Aguardando',
    className: 'bg-orange-50 text-orange-600 border-orange-200',
    icon: Clock,
  },
  ACTIVE: {
    label: 'Ativo',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejeitado',
    className: 'bg-red-50 text-red-600 border-red-200',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-gray-50 text-gray-500 border-gray-200',
    icon: XCircle,
  },
}

export default function TeamMembersPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const teamId = (session?.user as any)?.teamId
  const teamRole = (session?.user as any)?.teamRole
  const canManage = teamRole === 'HEAD_COACH' || teamRole === 'ADMIN'

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team/members')
      const data = await res.json()
      setMembers(data.members ?? [])
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao carregar membros.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const handleApprove = async (userId: string, membershipId: string) => {
    if (!teamId) return
    setActionLoading(membershipId)
    setFeedback(null)
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'STAFF_OTHER' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aprovar')
      }
      setFeedback({ type: 'success', message: 'Membro aprovado com sucesso!' })
      await loadMembers()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: string, membershipId: string) => {
    if (!teamId) return
    setActionLoading(membershipId)
    setFeedback(null)
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao rejeitar')
      }
      setFeedback({ type: 'success', message: 'Solicitação rejeitada.' })
      await loadMembers()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setActionLoading(null)
    }
  }

  const pending = members.filter((m) => m.status === 'PENDING')
  const active = members.filter((m) => m.status === 'ACTIVE')
  const others = members.filter((m) => m.status !== 'PENDING' && m.status !== 'ACTIVE')

  return (
    <div className="space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border)] pb-10">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] mb-4">
            <Link href="/team/dashboard" className="hover:text-[var(--verde)] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--black)]">Membros</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-display font-black text-[var(--black)] tracking-tight leading-tight italic uppercase">
            Membros da Equipe
          </h1>
          <p className="text-[var(--gray)] font-medium mt-2 text-sm">
            {canManage
              ? 'Gerencie solicitações de entrada e membros ativos.'
              : 'Veja os membros da sua equipe.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-white border border-[var(--border)] shadow-sm flex items-center gap-3">
            <Users className="w-4 h-4 text-[var(--verde)]" />
            <div>
              <div className="text-xs font-black text-[var(--black)] uppercase tracking-wide">{active.length} ativos</div>
              {pending.length > 0 && (
                <div className="text-[10px] font-bold text-orange-500">{pending.length} pendente{pending.length > 1 ? 's' : ''}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          'flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-bold',
          feedback.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        )}>
          {feedback.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <XCircle className="w-5 h-5 shrink-0" />}
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--verde)]" />
        </div>
      ) : (
        <>
          {/* Pending requests — only shown to managers */}
          {canManage && pending.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-orange-500 rounded-full" />
                <h2 className="text-base font-black text-[var(--black)] uppercase tracking-tight italic">
                  Solicitações Pendentes ({pending.length})
                </h2>
              </div>
              <div className="space-y-3">
                {pending.map((member) => (
                  <div key={member.id} className="bg-white border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                        <span className="text-orange-600 font-black text-sm uppercase">
                          {member.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-black text-[var(--black)] text-sm uppercase tracking-tight">{member.user.name}</p>
                        <p className="text-[11px] text-[var(--gray)] font-medium">{member.user.email}</p>
                        <p className="text-[10px] text-[var(--gray)] font-bold uppercase tracking-wide mt-0.5">
                          Solicitado em {new Date(member.requestedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleApprove(member.userId, member.id)}
                        disabled={actionLoading === member.id}
                        className="flex-1 sm:flex-none h-9 px-5 rounded-xl bg-[var(--verde)] hover:bg-[var(--verde-dark)] text-white font-black uppercase tracking-widest text-xs transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading === member.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(member.userId, member.id)}
                        disabled={actionLoading === member.id}
                        className="flex-1 sm:flex-none h-9 px-5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active members */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-[var(--verde)] rounded-full" />
              <h2 className="text-base font-black text-[var(--black)] uppercase tracking-tight italic">
                Membros Ativos ({active.length})
              </h2>
            </div>
            {active.length === 0 ? (
              <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
                <Shield className="w-10 h-10 text-[var(--gray)] mx-auto mb-3 opacity-40" />
                <p className="text-[var(--gray)] font-medium text-sm">Nenhum membro ativo ainda.</p>
              </div>
            ) : (
              <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                {active.map((member, i) => {
                  const StatusIcon = STATUS_CONFIG.ACTIVE.icon
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        'flex items-center justify-between px-6 py-4 gap-4',
                        i < active.length - 1 && 'border-b border-[var(--border)]'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center shrink-0">
                          <span className="text-[var(--black)] font-black text-sm uppercase">
                            {member.user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-[var(--black)] text-sm uppercase tracking-tight">{member.user.name}</p>
                          <p className="text-[11px] text-[var(--gray)] font-medium">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-black text-[var(--gray)] uppercase tracking-widest hidden sm:block">
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                        <span className={cn(
                          'flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wide',
                          STATUS_CONFIG.ACTIVE.className
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_CONFIG.ACTIVE.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Rejected / Cancelled — collapsed section */}
          {others.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-gray-300 rounded-full" />
                <h2 className="text-base font-black text-[var(--gray)] uppercase tracking-tight italic">
                  Histórico ({others.length})
                </h2>
              </div>
              <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                {others.map((member, i) => {
                  const cfg = STATUS_CONFIG[member.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.CANCELLED
                  const StatusIcon = cfg.icon
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        'flex items-center justify-between px-6 py-4 gap-4 opacity-60',
                        i < others.length - 1 && 'border-b border-[var(--border)]'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center shrink-0">
                          <span className="text-[var(--gray)] font-black text-sm uppercase">
                            {member.user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-[var(--black)] text-sm uppercase tracking-tight">{member.user.name}</p>
                          <p className="text-[11px] text-[var(--gray)] font-medium">{member.user.email}</p>
                        </div>
                      </div>
                      <span className={cn(
                        'flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wide shrink-0',
                        cfg.className
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
