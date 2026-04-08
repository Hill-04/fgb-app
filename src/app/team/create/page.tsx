'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateTeamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    hasGym: false,
    gym: {
      name: '',
      address: '',
      city: '',
      capacity: '',
      availability: 'sabado_domingo'
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar equipe');
      }

      // Redirecionar para dashboard
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
          <div className="w-9 h-9 bg-orange-500 flex items-center justify-center rounded-lg shadow-sm">
            <span className="font-display font-black text-white text-xs tracking-wider">FGB</span>
          </div>
          <div className="text-sm font-bold text-[var(--black)] uppercase tracking-wide">Criar Equipe</div>
        </div>
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="fgb-card bg-white border border-[var(--border)] rounded-[2rem] p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--black)] mb-6 uppercase tracking-tight italic">Informações Básicas</h2>

            <div className="space-y-4">
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
                  className="bg-gray-50 border-[var(--border)] text-[var(--black)] focus-visible:ring-orange-500 rounded-xl"
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
                  className="bg-gray-50 border-[var(--border)] text-[var(--black)] focus-visible:ring-orange-500 rounded-xl"
                />
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  Cole o link de uma imagem hospedada online
                </p>
              </div>
            </div>
          </div>

          {/* Ginásio */}
          <div className="fgb-card bg-white border border-[var(--border)] rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--black)] uppercase tracking-tight italic">Ginásio Próprio</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasGym}
                  onChange={(e) => setFormData({ ...formData, hasGym: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-[var(--border)] rounded focus:ring-orange-500"
                />
                <span className="text-xs font-bold text-[var(--gray)] uppercase tracking-wide">Possui ginásio próprio</span>
              </label>
            </div>

            {formData.hasGym && (
              <div className="space-y-4 mt-6 pt-6 border-t border-[var(--border)]">
                <div>
                  <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                    Nome do Ginásio *
                  </label>
                  <Input
                    type="text"
                    required={formData.hasGym}
                    value={formData.gym.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      gym: { ...formData.gym, name: e.target.value }
                    })}
                    placeholder="Ex: Ginásio Municipal"
                    className="bg-gray-50 border-[var(--border)] text-[var(--black)] focus-visible:ring-orange-500 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                    Endereço *
                  </label>
                  <Input
                    type="text"
                    required={formData.hasGym}
                    value={formData.gym.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      gym: { ...formData.gym, address: e.target.value }
                    })}
                    placeholder="Rua, número, bairro"
                    className="bg-gray-50 border-[var(--border)] text-[var(--black)] focus-visible:ring-orange-500 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                      Cidade *
                    </label>
                    <Input
                      type="text"
                      required={formData.hasGym}
                      value={formData.gym.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        gym: { ...formData.gym, city: e.target.value }
                      })}
                      placeholder="Ex: Caxias do Sul"
                      className="bg-gray-50 border-[var(--border)] text-[var(--black)] focus-visible:ring-orange-500 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                      Capacidade *
                    </label>
                    <Input
                      type="number"
                      required={formData.hasGym}
                      value={formData.gym.capacity}
                      onChange={(e) => setFormData({
                        ...formData,
                        gym: { ...formData.gym, capacity: e.target.value }
                      })}
                      placeholder="500"
                      className="bg-gray-50 border-[var(--border)] text-[var(--black)] focus-visible:ring-orange-500 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wide">
                    Disponibilidade *
                  </label>
                  <select
                    required={formData.hasGym}
                    value={formData.gym.availability}
                    onChange={(e) => setFormData({
                      ...formData,
                      gym: { ...formData.gym, availability: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-xl text-[var(--black)] focus-visible:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="sabado_domingo">Sábado e Domingo</option>
                    <option value="sabado">Apenas Sábado</option>
                    <option value="domingo">Apenas Domingo</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 border-[var(--border)] text-[var(--gray)] hover:bg-gray-100 font-black uppercase tracking-widest h-12 rounded-xl transition-colors"
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase tracking-widest h-12 rounded-xl shadow-md transition-all hover:shadow-lg"
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
