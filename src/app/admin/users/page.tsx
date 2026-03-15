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
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Usuários</h1>
          <p className="text-[--text-secondary] font-medium uppercase tracking-widest text-[10px]">Controle de Acessos e Administração</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 h-12 rounded-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#111] border-white/5 h-11 rounded-xl text-white"
          />
        </div>
      </div>

      <Card className="bg-[#121212] border-white/5 overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Perfil</th>
                  <th className="px-8 py-5">Vínculo</th>
                  <th className="px-8 py-5">Permissões</th>
                  <th className="px-8 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-20 text-slate-500 uppercase font-black tracking-widest text-xs animate-pulse">Carregando usuários...</td></tr>
                ) : filteredUsers.map((user) => {
                  const isCurrentUser = session?.user?.email === user.email
                  const isSupremeAdmin = user.email === 'brayanalexguarnieri@gmail.com'

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${user.isAdmin ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-800 text-slate-400'}`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white uppercase tracking-tight">{user.name} {isCurrentUser && <span className="text-[10px] text-[#FF6B00] ml-2 font-black tracking-widest">VOCÊ</span>}</div>
                            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         {user.membership ? (
                           <div>
                             <div className="text-white font-bold text-xs uppercase tracking-tight">{user.membership.team.name}</div>
                             <div className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">{user.membership.role}</div>
                           </div>
                         ) : (
                           <span className="text-slate-600 italic text-xs">Sem vínculo ativo</span>
                         )}
                      </td>
                      <td className="px-8 py-6">
                        {isSupremeAdmin ? (
                          <Badge variant="blue" size="sm" withDot>Admin Supremo</Badge>
                        ) : user.isAdmin ? (
                          <Badge variant="orange" size="sm" withDot>Administrador</Badge>
                        ) : (
                          <Badge variant="outline" size="sm">Membro Padrão</Badge>
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
                            >
                              <Shield className={`w-4 h-4 ${user.isAdmin ? 'text-red-400' : 'text-orange-400'}`} />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} className="text-slate-500 hover:text-white">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {!isSupremeAdmin && !isCurrentUser && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="text-slate-500 hover:text-red-500">
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
        </CardContent>
      </Card>

      {/* Modal User */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl bg-[#0A0A0A] border-white/10 text-white rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-3xl font-display font-black uppercase tracking-tight">
                {editingId ? 'Editar Perfil' : 'Novo Usuário'}
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Configurações de conta e sistema</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome Completo</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} className="bg-white/[0.03] border-white/10 h-12 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Institucional</Label>
                  <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="bg-white/[0.03] border-white/10 h-12 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso'}
                  </Label>
                  <Input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} className="bg-white/[0.03] border-white/10 h-12 rounded-xl" />
                </div>

                <div className="pt-2">
                    <div 
                      onClick={() => setFormIsAdmin(!formIsAdmin)}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${formIsAdmin ? 'bg-orange-600/10 border-orange-500/40' : 'bg-white/[0.02] border-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${formIsAdmin ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800 text-slate-500'}`}>
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest">Privilégios Admin</div>
                          <div className="text-[10px] text-slate-500 font-medium tracking-tight">Acesso total ao painel da federação</div>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${formIsAdmin ? 'bg-orange-600' : 'bg-slate-800'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formIsAdmin ? 'left-5' : 'left-1'}`} />
                      </div>
                    </div>
                </div>

                {formError && <p className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-500/10 p-4 rounded-xl">{formError}</p>}

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" type="button" onClick={() => setShowDialog(false)} className="flex-1 h-12 font-bold text-slate-400 hover:text-white">Cancelar</Button>
                  <Button disabled={submitLoading} className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-12 rounded-xl">
                    {submitLoading ? 'Processando...' : 'Salvar Usuário'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
