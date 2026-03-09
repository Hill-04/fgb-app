"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

type Category = {
  id: string
  name: string
  code: string
}

type Championship = {
  id: string
  name: string
  year: number
  minTeamsPerCategory: number
  categories: Category[]
}

export default function ChampionshipRegister() {
  const router = useRouter()
  const params = useParams()
  const championshipId = params.id as string

  const [championship, setChampionship] = useState<Championship | null>(null)
  const [loadingChampionship, setLoadingChampionship] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [blockedDates, setBlockedDates] = useState<{date: string, reason: string}[]>([])
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')

  useEffect(() => {
    const fetchChampionship = async () => {
      try {
        const res = await fetch(`/api/championships/${championshipId}`)
        if (!res.ok) {
          setFetchError('Campeonato não encontrado.')
          return
        }
        const data = await res.json()
        setChampionship(data)
      } catch (err) {
        setFetchError('Erro ao carregar campeonato.')
      } finally {
        setLoadingChampionship(false)
      }
    }
    fetchChampionship()
  }, [championshipId])

  const handleToggleCat = (code: string) => {
    if (selectedCats.includes(code)) {
      setSelectedCats(selectedCats.filter(c => c !== code))
    } else {
      setSelectedCats([...selectedCats, code])
    }
  }

  const addBlockedDate = () => {
    if (!newDate) return
    setBlockedDates([...blockedDates, { date: newDate, reason: newReason }])
    setNewDate('')
    setNewReason('')
  }

  const removeBlockedDate = (index: number) => {
    setBlockedDates(blockedDates.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCats.length === 0) {
      setSubmitError('Selecione pelo menos uma categoria.')
      return
    }

    setLoading(true)
    setSubmitError('')

    try {
      const res = await fetch(`/api/championships/${championshipId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCategories: selectedCats,
          blockedDates,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error || 'Erro ao realizar inscrição.')
        setLoading(false)
        return
      }

      alert('Inscrição confirmada com sucesso!')
      router.push('/team/dashboard')
    } catch (err) {
      setSubmitError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  if (loadingChampionship) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Carregando campeonato...</p>
      </div>
    )
  }

  if (fetchError || !championship) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">Erro</h1>
        <p className="text-red-400">{fetchError || 'Campeonato não encontrado.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Inscrição — {championship.name}
        </h1>
        <p className="text-slate-400">Preencha as informações para a sua equipe participar do campeonato.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Categorias */}
        <Card className="bg-slate-900/50 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Categorias Disputadas</CardTitle>
            <CardDescription className="text-slate-400">
              Selecione todas as categorias que a sua equipe irá disputar. Precisamos de um mínimo de {championship.minTeamsPerCategory} equipes para cada categoria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {championship.categories.length === 0 ? (
              <p className="text-slate-400 text-sm">Este campeonato ainda não possui categorias cadastradas.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {championship.categories.map(cat => (
                  <div key={cat.id} className="flex items-center space-x-2 bg-slate-950 p-3 rounded-md border border-white/5">
                    <Checkbox
                      id={cat.code}
                      checked={selectedCats.includes(cat.code)}
                      onCheckedChange={() => handleToggleCat(cat.code)}
                      className="border-white/30 data-[state=checked]:bg-orange-500"
                    />
                    <Label htmlFor={cat.code} className="text-sm font-medium leading-none cursor-pointer">
                      {cat.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {selectedCats.length === 0 && championship.categories.length > 0 && (
              <p className="text-xs text-orange-400 mt-4 font-semibold">Cuidado: nenhuma categoria selecionada ainda.</p>
            )}
          </CardContent>
        </Card>

        {/* Datas Bloqueadas */}
        <Card className="bg-slate-900/50 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Datas Indisponíveis (Fins de Semana)</CardTitle>
            <CardDescription className="text-slate-400">
              A IA de organização evitará agendar jogos nestas datas. Limite de 3 fins de semana bloqueados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Label>Data / Fim de Semana</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="bg-slate-950/50 border-white/10"
                />
              </div>
              <div className="space-y-2 flex-[2]">
                <Label>Motivo (opcional)</Label>
                <Input
                  placeholder="Ex: Torneio Sulbrasileiro, Formatura..."
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  className="bg-slate-950/50 border-white/10"
                />
              </div>
              <Button
                type="button"
                onClick={addBlockedDate}
                variant="secondary"
                className="bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
                disabled={blockedDates.length >= 3}
              >
                Adicionar
              </Button>
            </div>

            {blockedDates.length > 0 && (
              <div className="rounded-md border border-white/10 divide-y divide-white/5">
                {blockedDates.map((d, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-slate-950/30">
                    <div>
                      <span className="font-semibold text-orange-400">{d.date}</span>
                      {d.reason && <span className="text-slate-400 text-sm ml-2">— {d.reason}</span>}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlockedDate(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {blockedDates.length >= 3 && (
              <p className="text-xs text-orange-400 mt-2">Você atingiu o limite de datas que podem ser bloqueadas.</p>
            )}
          </CardContent>
        </Card>

        {/* Ginásio */}
        <Card className="bg-slate-900/50 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Locais e Ginásio</CardTitle>
            <CardDescription className="text-slate-400">
              Verifique se as informações de local para sediar os jogos estão corretas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Ginásio</Label>
                <Input
                  defaultValue="Ginásio Municipal"
                  className="bg-slate-950/50 border-white/10 text-slate-400"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidade</Label>
                <Input
                  defaultValue="1500 pessoas"
                  className="bg-slate-950/50 border-white/10 text-slate-400"
                  readOnly
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Para alterar, acesse o Perfil da Equipe.</p>
          </CardContent>
        </Card>

        {submitError && (
          <p className="text-sm text-red-400 font-medium">{submitError}</p>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-4 pb-10">
          <Button
            type="submit"
            size="lg"
            className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg shadow-orange-600/20"
            disabled={loading}
          >
            {loading ? "Processando..." : "Confirmar Inscrição Definitiva"}
          </Button>
        </div>

      </form>
    </div>
  )
}
