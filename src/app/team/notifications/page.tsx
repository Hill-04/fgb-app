"use client"

import { useState, useEffect } from 'react'
import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react'

type Notification = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  info:    { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  warning: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  danger:  { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
}

export default function TeamNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/team/notifications')
      .then(r => r.json())
      .then(data => { setNotifications(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const markRead = async (id: string) => {
    await fetch(`/api/team/notifications/${id}`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto font-sans">
      <div className="animate-fade-in border-b border-[var(--border)] pb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-[var(--gray)] font-bold uppercase tracking-widest text-[10px]">Central de Avisos</span>
        </div>
        <h1 className="text-4xl font-display font-black text-[var(--black)] tracking-tight uppercase italic">Notificações</h1>
        <p className="text-[var(--gray)] mt-2 font-medium">Avisos e comunicados da Federação Gaúcha de Basquete.</p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 border border-[var(--border)] rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-gray-50 border border-[var(--border)] rounded-3xl p-20 text-center shadow-inner">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-[var(--black)] mb-2 uppercase tracking-tight italic">Nenhuma notificação</h3>
          <p className="text-[var(--gray)] max-w-xs mx-auto font-medium">Você receberá avisos da Federação aqui quando houver atualizações importantes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info
            const Icon = config.icon
            return (
              <div
                key={notif.id}
                className={`fgb-card bg-white border rounded-2xl p-5 flex items-start gap-4 transition-all cursor-pointer shadow-sm hover:shadow-md ${notif.read ? 'border-[var(--border)] bg-gray-50/50 opacity-80' : 'border-orange-200 hover:border-orange-300'}`}
                onClick={() => !notif.read && markRead(notif.id)}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0 border border-[var(--border)]/50`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-bold text-sm uppercase tracking-tight ${notif.read ? 'text-[var(--black)]' : 'text-orange-700'}`}>{notif.title}</p>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-[var(--amarelo)] shrink-0 shadow-sm" />}
                  </div>
                  <p className="text-[var(--gray)] text-xs font-medium">{notif.message}</p>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">{new Date(notif.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
