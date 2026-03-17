'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ManualRegistrationModal } from './ManualRegistrationModal'

type RegistrationActionsProps = {
  championshipId: string
  registration: any // Full registration object for editing
  categories: any[]
  startDate?: Date
  endDate?: Date
}

export function RegistrationActions({ 
  championshipId, 
  registration, 
  categories,
  startDate,
  endDate
}: RegistrationActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpdateStatus = async (status: 'CONFIRMED' | 'REJECTED') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/championships/${championshipId}/registrations/${registration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        router.refresh()
      } else {
        const errorData = await res.json()
        alert(`Erro: ${errorData.error}`)
      }
    } catch (error) {
      alert('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/championships/${championshipId}/registrations/${registration.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        router.refresh()
      } else {
        const errorData = await res.json()
        alert(`Erro: ${errorData.error}`)
      }
    } catch (error) {
      alert('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Format data for the modal
  const formattedInitialData = {
    id: registration.id,
    teamId: registration.teamId,
    selectedCategories: registration.categories.map((c: any) => c.category.name),
    canHost: registration.canHost,
    gymName: registration.gymName,
    gymAddress: registration.gymAddress,
    gymCity: registration.gymCity,
    gymMapsLink: registration.gymMapsLink,
    blockedDates: (registration.blockedDates || []).map((bd: any) => ({
      startDate: bd.startDate instanceof Date ? bd.startDate.toISOString() : bd.startDate,
      endDate: bd.endDate instanceof Date ? bd.endDate.toISOString() : bd.endDate,
      reason: bd.reason
    })),
    observations: registration.observations,
    status: registration.status
  }

  return (
    <div className="flex gap-2">
      {/* Quick Status Actions */}
      {registration.status !== 'CONFIRMED' && (
        <Button 
          size="icon" 
          variant="ghost"
          onClick={() => handleUpdateStatus('CONFIRMED')}
          disabled={loading}
          className="text-green-500 hover:text-green-400 hover:bg-green-500/10 h-8 w-8"
          title="Aprovar"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        </Button>
      )}
      
      {registration.status !== 'REJECTED' && (
        <Button 
          size="icon" 
          variant="ghost"
          onClick={() => handleUpdateStatus('REJECTED')}
          disabled={loading}
          className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
          title="Rejeitar"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
        </Button>
      )}

      <div className="w-px h-4 bg-white/10 mx-1 self-center" />

      {/* Edit Action */}
      <ManualRegistrationModal 
        championshipId={championshipId}
        categories={categories}
        startDate={startDate}
        endDate={endDate}
        initialData={formattedInitialData}
        trigger={
          <Button 
            size="icon" 
            variant="ghost"
            className="text-white/40 hover:text-white hover:bg-white/10 h-8 w-8"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        }
      />

      {/* Delete Action */}
      <AlertDialog>
      <AlertDialogTrigger render={
        <Button 
          size="icon" 
          variant="ghost" 
          className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
          disabled={loading}
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      } />
        <AlertDialogContent className="bg-[#0A0A0A] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Inscrição?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. A equipe será removida deste campeonato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-0">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
