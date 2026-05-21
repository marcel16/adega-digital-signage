'use client';

import { useEffect, useState } from 'react';
import { Monitor, Image, Store, HardDrive, TrendingUp, Tv } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { formatDate, formatBytes } from '@/lib/utils';
import type { DashboardStats, AuditLog } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/recent-activity'),
    ]).then(([s, r]) => {
      setStats(s.data);
      setRecent(r.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  if (!stats) return <p>Erro ao carregar dashboard</p>;

  const cards = [
    { title: 'Estabelecimentos', value: stats.totalEstabelecimentos, icon: Store, color: 'text-blue-600' },
    { title: 'TVs Online', value: stats.tvsOnline, icon: Monitor, color: 'text-green-600', sub: `${stats.tvsOffline} offline` },
    { title: 'Mídias', value: stats.totalMidias, icon: Image, color: 'text-purple-600', sub: `${stats.totalMidiasByTipo.image} imagens, ${stats.totalMidiasByTipo.video} vídeos` },
    { title: 'Armazenamento', value: formatBytes(stats.storageUsed * 1024 * 1024), icon: HardDrive, color: 'text-orange-600', sub: `${stats.storageUsagePercent.toFixed(1)}% usado` },
  ];

  const campaignCounts = stats.totalCampanhas;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Ativas</span><Badge>{campaignCounts.active}</Badge></div>
              <div className="flex justify-between"><span>Rascunho</span><Badge variant="secondary">{campaignCounts.draft}</Badge></div>
              <div className="flex justify-between"><span>Concluídas</span><Badge variant="outline">{campaignCounts.completed}</Badge></div>
              <div className="flex justify-between font-medium pt-2 border-t"><span>Total</span><span>{campaignCounts.total}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.slice(0, 5).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">Nenhuma atividade</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}