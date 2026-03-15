'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/Badge'
import { useSession } from 'next-auth/react'

type User = {
  id: string
  name: string
  email: string
  isAdmin: boolean
  createdAt: string
  membership?: {
    team: {
      name: string
    }
    role: string
  }
}

export default function UsersManagementPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAdminRole = async (userId: string, currentStatus: boolean, email: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentStatus })
      })
      
      if (res.ok) {
        fetchUsers() // Refresh list
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao alterar permissão')
      }
    } catch (error) {
      alert('Erro inesperado')
    }
  }

  if (loading) return <div className="text-white">Carregando usuários...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Gestão de Usuários</h1>
        <p className="text-slate-400">Controle de acesso e permissões administrativas do sistema.</p>
      </div>

      <Card className="bg-slate-900/50 border-white/10 text-white">
        <CardHeader>
          <CardTitle>Usuários Cadastrados ({users.length})</CardTitle>
          <CardDescription className="text-slate-400">
            Atenção: Usuários com a flag "Admin" têm acesso total a esta área administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-950 uppercase">
                <tr>
                  <th className="px-4 py-3">Nome / Email</th>
                  <th className="px-4 py-3">Equipe Vinculada</th>
                  <th className="px-4 py-3">Cargo FGB</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentUser = session?.user?.email === user.email
                  const isSupremeAdmin = user.isAdmin && user.email === 'brayanalexguarnieri@gmail.com' // hardcoded check para o UI

                  return (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-200">{user.name} {isCurrentUser && '(Você)'}</div>
                        <div className="text-slate-400 text-xs">{user.email}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {user.membership ? (
                          <span>{user.membership.team.name} <span className="text-slate-500 text-xs">({user.membership.role})</span></span>
                        ) : (
                          <span className="text-slate-500 italic">Nenhuma</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isSupremeAdmin ? (
                          <Badge variant="blue">Admin Supremo</Badge>
                        ) : user.isAdmin ? (
                          <Badge variant="success">Administrador</Badge>
                        ) : (
                          <Badge variant="default" className="bg-slate-800 text-slate-300">Usuário Comum</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant={user.isAdmin ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleAdminRole(user.id, user.isAdmin, user.email)}
                          disabled={isSupremeAdmin || isCurrentUser}
                          className={!user.isAdmin && !isSupremeAdmin && !isCurrentUser ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                        >
                          {user.isAdmin ? 'Revogar Admin' : 'Tornar Admin'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
