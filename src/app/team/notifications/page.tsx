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
  info:    { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  danger:  { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
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
    <div className="space-y-10 max-w-4xl mx-auto">
      <div className="animate-fade-in border-b border-white/[0.05] pb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Central de Avisos</span>
        </div>
        <h1 className="text-4xl font-display font-black text-white tracking-tight">Notificações</h1>
        <p className="text-slate-400 mt-2 font-medium">Avisos e comunicados da Federação Gaúcha de Basquete.</p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
          <Bell className="w-16 h-16 text-slate-800 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma notificação</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Você receberá avisos da Federação aqui quando houver atualizações importantes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info
            const Icon = config.icon
            return (
              <div
                key={notif.id}
                className={`bg-[#121212] border rounded-2xl p-5 flex items-start gap-4 transition-all cursor-pointer ${notif.read ? 'border-white/5 opacity-60' : 'border-[#FF6B00]/20 hover:border-[#FF6B00]/40'}`}
                onClick={() => !notif.read && markRead(notif.id)}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white text-sm">{notif.title}</p>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-[#FF6B00] shrink-0" />}
                  </div>
                  <p className="text-slate-400 text-xs">{notif.message}</p>
                  <p className="text-slate-600 text-[10px] mt-2">{new Date(notif.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
