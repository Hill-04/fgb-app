import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic'; // Ensures this page isn't statically compiled

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    include: { user: true, gym: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Gestão de Equipes</h1>
        <p className="text-slate-400">Aqui ficam armazenadas as contas e status das equipes cadastradas no sistema da federação.</p>
      </div>

      <Card className="bg-slate-900/50 border-white/10 text-white">
        <CardHeader>
          <CardTitle>Equipes Registradas ({teams.length})</CardTitle>
          <CardDescription className="text-slate-400">Selecione uma equipe para gerenciar pendências</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-300">Equipe</TableHead>
                  <TableHead className="text-slate-300">Responsável</TableHead>
                  <TableHead className="text-slate-300">Email Contato</TableHead>
                  <TableHead className="text-slate-300">Cidade</TableHead>
                  <TableHead className="text-slate-300 text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                      Nenhuma equipe cadastrada ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((team) => (
                    <TableRow key={team.id} className="border-white/10 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-200">{team.name}</TableCell>
                      <TableCell className="text-slate-300">{team.responsible}</TableCell>
                      <TableCell className="text-slate-300">{team.user?.email || 'N/A'}</TableCell>
                      <TableCell className="text-slate-300">{team.city}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="bg-transparent border-white/20 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30">
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
