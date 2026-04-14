'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO'
]

export default function CreateTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sex: '' as 'masculino' | 'feminino' | 'misto' | '',
    city: '',
    state: 'RS',
    phone: '',
    responsible: '',
    logoUrl: '',
    hasGym: false,
    gym: {
      name: '',
      address: '',
      city: '',
      capacity: '',
      availability: 'sabado_domingo',
      canHost: true,
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.sex) {
      setError('Selecione o sexo da equipe');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        gym: formData.hasGym ? formData.gym : null,
      };

      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar equipe');
      }

      router.push('/team/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-[var(--black)] font-sans">
      {/* Header */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-[var(--border)] bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center rounded-lg shadow-sm">
            <span className="font-display font-black text-white text-xs tracking-wider">FGB</span>
          </div>
          <div className="leading-none">
            <div className="text-xs font-bold text-[var(--black)] uppercase tracking-wide">Criar Equipe</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/team/onboarding')} className="text-xs text-[var(--gray)]">
          Cancelar
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-black uppercase text-[var(--black)] mb-2 italic tracking-tight">
            Criar Nova Equipe
          </h1>
          <p className="text-[var(--gray)] font-medium">
            Preencha os dados da sua equipe. Você será automaticamente o Head Coach.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações da Equipe */}
          <div className="bg-white border border-[var(--border)] rounded-[2rem] p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--black)] mb-6 uppercase tracking-tight italic">
              Dados da Equipe
            </h2>
            <div className="space-y-5">

              <div>
                <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                  Nome da Equipe *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Caxias Basquete"
                  className="bg-gray-50 border-[var(--border)] focus-visible:ring-orange-500 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                  Sexo da Equipe *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['masculino', 'feminino', 'misto'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, sex: s })}
                      className={`py-2.5 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all ${
                        formData.sex === s
                          ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                          : 'border-[var(--border)] text-[var(--gray)] hover:border-orange-300 bg-gray-50'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                    Cidade *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: Porto Alegre"
                    className="bg-gray-50 border-[var(--border)] focus-visible:ring-orange-500 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                    Estado *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-xl text-[var(--black)] focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                  >
                    {STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                  Responsável Principal *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Nome completo do responsável"
                  className="bg-gray-50 border-[var(--border)] focus-visible:ring-orange-500 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                  Telefone de Contato *
                </label>
                <Input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(51) 9 9999-9999"
                  className="bg-gray-50 border-[var(--border)] focus-visible:ring-orange-500 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                  URL do Logótipo (opcional)
                </label>
                <Input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                  className="bg-gray-50 border-[var(--border)] focus-visible:ring-orange-500 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Ginásio */}
          <div className="bg-white border border-[var(--border)] rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-[var(--black)] uppercase tracking-tight italic">Ginásio Próprio</h2>
                <p className="text-xs text-[var(--gray)] mt-1 font-medium">Informação usada para organização de jogos em casa</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasGym}
                  onChange={(e) => setFormData({ ...formData, hasGym: e.target.checked })}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
                <span className="text-xs font-bold text-[var(--gray)] uppercase tracking-wide">Possui ginásio</span>
              </label>
            </div>

            {formData.hasGym && (
              <div className="space-y-4 mt-6 pt-6 border-t border-[var(--border)]">
                <div>
                  <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">Nome do Ginásio *</label>
                  <Input
                    type="text"
                    required
                    value={formData.gym.name}
                    onChange={(e) => setFormData({ ...formData, gym: { ...formData.gym, name: e.target.value } })}
                    placeholder="Ex: Ginásio Municipal"
                    className="bg-gray-50 border-[var(--border)] focus-visible:ring-orange-500 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">Endereço *</label>
                  <Input
                    type="text"
                    required
                    value={formData.gym.address}
                    onChange={(e) => setFormData({ ...formData, gym: { ...formData.gym, address: e.target.value } })}
                    placeholder="Rua, número, bairro"
                    className="bg-gray-50 border-[var(--border)] focus-visible:ring-orange-500 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">Cidade *</label>
                    <Input
                      type="text"
                      required
                      value={formData.gym.city}
                      onChange={(e) => setFormData({ ...formData, gym: { ...formData.gym, city: e.target.value } })}
                      placeholder="Ex: Caxias do Sul"
                      className="bg-gray-50 border-[var(--border)] focus-visible:ring-orange-500 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">Capacidade *</label>
                    <Input
                      type="number"
                      required
                      min={1}
                      value={formData.gym.capacity}
                      onChange={(e) => setFormData({ ...formData, gym: { ...formData.gym, capacity: e.target.value } })}
                      placeholder="500"
                      className="bg-gray-50 border-[var(--border)] focus-visible:ring-orange-500 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">Disponibilidade *</label>
                  <select
                    required
                    value={formData.gym.availability}
                    onChange={(e) => setFormData({ ...formData, gym: { ...formData.gym, availability: e.target.value } })}
                    className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-xl text-[var(--black)] focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                  >
                    <option value="sabado_domingo">Sábado e Domingo</option>
                    <option value="sabado">Apenas Sábado</option>
                    <option value="domingo">Apenas Domingo</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={formData.gym.canHost}
                    onChange={(e) => setFormData({ ...formData, gym: { ...formData.gym, canHost: e.target.checked } })}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <span className="text-xs font-medium text-[var(--gray)]">Disponível para sediar jogos do campeonato</span>
                </label>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/team/onboarding')}
              className="flex-1 border-[var(--border)] text-[var(--gray)] hover:bg-gray-100 font-black uppercase tracking-widest h-12 rounded-xl"
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase tracking-widest h-12 rounded-xl shadow-md"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Equipe'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
