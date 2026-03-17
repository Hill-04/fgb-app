'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Mail, Loader2, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type ChampionshipManagementActionsProps = {
  championshipId: string
  championshipName: string
}

export function ChampionshipManagementActions({ championshipId, championshipName }: ChampionshipManagementActionsProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch(`/api/admin/championships/${championshipId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
      })

      if (res.ok) {
        toast.success("Notificações enviadas com sucesso!")
        setOpen(false)
        setTitle('')
        setMessage('')
      } else {
        const error = await res.json()
        toast.error(`Erro: ${error.error}`)
      }
    } catch (err) {
      toast.error("Erro ao enviar notificações")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2">
            <Bell className="w-4 h-4 text-[#FF6B00]" />
            Notificar Todas as Equipes
          </Button>
        }
      />
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md rounded-[32px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-black uppercase tracking-tight">Comunicado Geral</DialogTitle>
          <DialogDescription className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
            Enviar para todas as equipes de {championshipName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSendNotification} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Assunto / Título</Label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Atualização do Cronograma"
              className="bg-white/5 border-white/10 h-12 rounded-2xl focus:border-[#FF6B00]/50 transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Mensagem</Label>
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva o comunicado..."
              className="bg-white/5 border-white/10 min-h-[150px] rounded-2xl focus:border-[#FF6B00]/50 transition-all resize-none"
              required
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading || !title || !message}
              className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-12 rounded-2xl transition-all shadow-lg shadow-[#FF6B00]/20 gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Enviando...' : 'Disparar Comunicado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
