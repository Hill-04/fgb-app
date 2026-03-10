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
    <div className="min-h-screen bg-[--bg-main] text-[--text-main]">
      {/* Header */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-[--border-color] bg-[--bg-sidebar]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[--orange] flex items-center justify-center rotate-45">
            <span className="font-display font-black text-white text-xs -rotate-45">FGB</span>
          </div>
          <div className="text-sm font-semibold text-[--text-main]">Criar Equipe</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-black uppercase text-white mb-2">
            Criar Nova Equipe
          </h1>
          <p className="text-[--text-secondary]">
            Preencha os dados da sua equipe. Você será automaticamente o Head Coach.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[--error]/10 border border-[--error] rounded-lg text-[--error]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="card-fgb p-6">
            <h2 className="text-xl font-bold text-white mb-4">Informações Básicas</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[--text-secondary] mb-2">
                  Nome da Equipe *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Caxias Basquete"
                  className="bg-[--bg-main] border-[--border-color] text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[--text-secondary] mb-2">
                  URL do Logótipo (opcional)
                </label>
                <Input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                  className="bg-[--bg-main] border-[--border-color] text-white"
                />
                <p className="text-xs text-[--text-dim] mt-1">
                  Cole o link de uma imagem hospedada online
                </p>
              </div>
            </div>
          </div>

          {/* Ginásio */}
          <div className="card-fgb p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Ginásio Próprio</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasGym}
                  onChange={(e) => setFormData({ ...formData, hasGym: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[--text-secondary]">Possui ginásio próprio</span>
              </label>
            </div>

            {formData.hasGym && (
              <div className="space-y-4 mt-4 pt-4 border-t border-[--border-color]">
                <div>
                  <label className="block text-sm font-medium text-[--text-secondary] mb-2">
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
                    className="bg-[--bg-main] border-[--border-color] text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[--text-secondary] mb-2">
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
                    className="bg-[--bg-main] border-[--border-color] text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[--text-secondary] mb-2">
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
                      className="bg-[--bg-main] border-[--border-color] text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[--text-secondary] mb-2">
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
                      className="bg-[--bg-main] border-[--border-color] text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[--text-secondary] mb-2">
                    Disponibilidade *
                  </label>
                  <select
                    required={formData.hasGym}
                    value={formData.gym.availability}
                    onChange={(e) => setFormData({
                      ...formData,
                      gym: { ...formData.gym, availability: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-[--bg-main] border border-[--border-color] rounded-md text-white"
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
              className="flex-1"
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[--orange] hover:bg-[--orange-hover] text-white"
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
