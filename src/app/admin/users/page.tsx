"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/Badge'
import { useSession } from 'next-auth/react'
import { Plus, Search, UserCheck, Shield, Trash2, Edit2, Mail, ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formIsAdmin, setFormIsAdmin] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchUsers = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreateDialog = () => {
    setEditingId(null)
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormIsAdmin(false)
    setFormError('')
    setShowDialog(true)
  }

  const openEditDialog = (u: User) => {
    setEditingId(u.id)
    setFormName(u.name)
    setFormEmail(u.email)
    setFormPassword('') // Don't pre-fill password
    setFormIsAdmin(u.isAdmin)
    setFormError('')
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim() || !formEmail.trim()) return setFormError('Nome e Email são obrigatórios.')
    if (!editingId && !formPassword) return setFormError('Senha é obrigatória para novos usuários.')

    setSubmitLoading(true)
    try {
      const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword || undefined,
          isAdmin: formIsAdmin
        })
      })

      if (res.ok) {
        setShowDialog(false)
        fetchUsers()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Erro ao processar usuário')
      }
    } catch (err) {
      setFormError('Erro de conexão')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este usuário?')) return

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch (error) {
      alert('Erro de conexão')
    }
  }

  const toggleAdminFast = async (userId: string, currentStatus: boolean, email: string) => {
    const isCurrent = session?.user?.email === email
    if (isCurrent) return alert('Você não pode alterar seu próprio cargo.')
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentStatus })
      })
      if (res.ok) fetchUsers()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="fgb-display text-4xl text-[var(--black)] leading-none mb-2">Usuários</h1>
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Controle de Acessos e Administração</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="fgb-btn-primary px-8 h-12"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray)]" />
          <Input 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-[var(--border)] h-11 rounded-xl text-[var(--black)] font-sans shadow-sm focus-visible:ring-1 focus-visible:ring-[var(--verde)]"
          />
        </div>
      </div>

      <div className="fgb-card p-0 overflow-hidden">
        <div className="fgb-table-wrap">
          <table className="fgb-table w-full text-sm text-left">
            <thead className="bg-[var(--gray-l)] fgb-label text-[var(--gray)]">
              <tr>
                <th className="px-8 py-5">Perfil</th>
                <th className="px-8 py-5">Vínculo</th>
                <th className="px-8 py-5">Permissões</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20 fgb-label text-[var(--gray)] animate-pulse">Carregando usuários...</td></tr>
              ) : filteredUsers.map((user) => {
                const isCurrentUser = session?.user?.email === user.email
                const isSupremeAdmin = user.email === 'brayanalexguarnieri@gmail.com'

                return (
                  <tr key={user.id} className="hover:bg-[var(--gray-l)] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${user.isAdmin ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-100 text-[var(--gray)]'}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--black)] tracking-tight font-sans flex items-center">
                            {user.name}
                            {isCurrentUser && <span className="fgb-badge fgb-badge-red ml-2" style={{ padding: '0 4px', fontSize: 8 }}>VOCÊ</span>}
                          </div>
                          <div className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       {user.membership ? (
                         <div>
                           <div className="font-bold text-[var(--black)] tracking-tight font-sans text-xs">{user.membership.team.name}</div>
                           <div className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>{user.membership.role}</div>
                         </div>
                       ) : (
                         <span className="text-[var(--gray)] italic text-xs">Sem vínculo ativo</span>
                       )}
                    </td>
                    <td className="px-8 py-6">
                      {isSupremeAdmin ? (
                        <Badge variant="blue" size="sm" withDot>Admin Supremo</Badge>
                      ) : user.isAdmin ? (
                        <span className="fgb-badge fgb-badge-red">Administrador</span>
                      ) : (
                        <span className="fgb-badge fgb-badge-outline">Membro</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isSupremeAdmin && !isCurrentUser && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleAdminFast(user.id, user.isAdmin, user.email)}
                            title={user.isAdmin ? "Revogar Admin" : "Tornar Admin"}
                            className="hover:bg-[var(--gray-l)]"
                          >
                            <Shield className={`w-4 h-4 ${user.isAdmin ? 'text-[var(--red)]' : 'text-orange-400'}`} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} className="text-[var(--gray)] hover:text-[var(--black)] hover:bg-[var(--gray-l)]">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {!isSupremeAdmin && !isCurrentUser && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="text-[var(--gray)] hover:text-[var(--red)] hover:bg-[var(--red)]/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal User */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-xl fgb-card overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-[var(--border)] bg-white">
              <h2 className="fgb-display text-3xl text-[var(--black)] tracking-tight">
                {editingId ? 'Editar Perfil' : 'Novo Usuário'}
              </h2>
              <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Configurações de conta e sistema</p>
            </div>
            <div className="p-8 bg-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">Nome Completo</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} className="bg-white border-[var(--border)] text-[var(--black)] shadow-sm h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--verde)]" />
                </div>

                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">Email Institucional</Label>
                  <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="bg-white border-[var(--border)] text-[var(--black)] shadow-sm h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--verde)]" />
                </div>

                <div className="space-y-2">
                  <Label className="fgb-label text-[var(--gray)]">
                    {editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso'}
                  </Label>
                  <Input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} className="bg-white border-[var(--border)] text-[var(--black)] shadow-sm h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--verde)]" />
                </div>

                <div className="pt-2">
                    <div 
                      onClick={() => setFormIsAdmin(!formIsAdmin)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${formIsAdmin ? 'bg-[var(--red)]/5 border-[var(--red)]' : 'bg-[var(--gray-l)] border-[var(--border)]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${formIsAdmin ? 'bg-[var(--red)] text-white' : 'bg-white border border-[var(--border)] text-[var(--gray)]'}`}>
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="fgb-label text-[var(--black)]" style={{ fontSize: 11 }}>Privilégios Admin</div>
                          <div className="text-xs text-[var(--gray)] font-sans">Acesso total ao painel da federação</div>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${formIsAdmin ? 'bg-[var(--red)]' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formIsAdmin ? 'left-5' : 'left-1'}`} />
                      </div>
                    </div>
                </div>

                {formError && <p className="fgb-label text-[var(--red)] bg-[var(--red)]/10 p-4 rounded-xl" style={{ textTransform: 'none', letterSpacing: 0 }}>{formError}</p>}

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" type="button" onClick={() => setShowDialog(false)} className="flex-1 h-12 text-[var(--gray)] font-bold hover:bg-[var(--gray-l)] hover:text-[var(--black)]">Cancelar</Button>
                  <Button disabled={submitLoading} className="flex-1 fgb-btn-primary h-12">
                    {submitLoading ? 'Processando...' : 'Salvar Usuário'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
