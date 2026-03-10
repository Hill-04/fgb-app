'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  _count: {
    members: number;
  };
}

export default function JoinTeamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadTeams();
  }, [search]);

  const loadTeams = async () => {
    try {
      const res = await fetch(`/api/teams?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error('Erro ao carregar equipes:', err);
    }
  };

  const handleJoinRequest = async (teamId: string, teamName: string) => {
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao solicitar entrada');
      }

      setSuccessMessage(`Solicitação enviada para ${teamName}! Aguarde aprovação do Head Coach.`);

      // Atualizar lista removendo a equipe que já foi solicitada
      setTeams(teams.filter(t => t.id !== teamId));
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
          <div className="text-sm font-semibold text-[--text-main]">Entrar em Equipe</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-black uppercase text-white mb-2">
            Procurar Equipes
          </h1>
          <p className="text-[--text-secondary]">
            Encontre uma equipe e solicite entrada. O Head Coach irá avaliar sua solicitação.
          </p>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-6 p-4 bg-[--error]/10 border border-[--error] rounded-lg text-[--error]">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-[--success]/10 border border-[--success] rounded-lg text-[--success]">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">{successMessage}</p>
                <p className="text-sm mt-1">Você pode voltar para a tela inicial enquanto aguarda.</p>
              </div>
            </div>
          </div>
        )}

        {/* Busca */}
        <div className="mb-8">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome da equipe..."
            className="bg-[--bg-card] border-[--border-color] text-white text-lg py-6"
          />
        </div>

        {/* Lista de Equipes */}
        <div className="space-y-4">
          {teams.length === 0 ? (
            <div className="card-fgb p-12 text-center">
              <svg className="w-16 h-16 text-[--text-dim] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-[--text-secondary]">
                {search ? 'Nenhuma equipe encontrada com esse nome' : 'Digite para buscar equipes'}
              </p>
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="card-fgb p-6 hover:border-[--blue-admin] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-[--bg-main] rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-[--text-dim]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xl font-bold text-white">{team.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        {team.city && team.state && (
                          <span className="text-sm text-[--text-secondary]">
                            {team.city}, {team.state}
                          </span>
                        )}
                        <span className="text-sm text-[--text-secondary]">
                          {team._count.members} {team._count.members === 1 ? 'membro' : 'membros'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleJoinRequest(team.id, team.name)}
                    disabled={loading}
                    className="bg-[--blue-admin] hover:bg-[--blue-light] text-white"
                  >
                    Solicitar Entrada
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botão Voltar */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => router.push('/team/onboarding')}
            className="w-full"
          >
            Voltar
          </Button>
        </div>
      </main>
    </div>
  );
}
