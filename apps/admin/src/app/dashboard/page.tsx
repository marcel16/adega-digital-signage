'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Tv,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  overdueClients: number;
  totalTvs: number;
  monthlyRevenue: number;
  revenueChart: { month: string; revenue: number }[];
  recentClients: any[];
  recentPayments: any[];
  systemHealth: { service: string; status: string; responseTimeMs?: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Clientes', value: stats?.totalClients ?? 0, icon: Users, color: 'text-blue-600' },
    { title: 'Clientes Ativos', value: stats?.activeClients ?? 0, icon: CheckCircle2, color: 'text-green-600' },
    { title: 'Em Trial', value: stats?.trialClients ?? 0, icon: Clock, color: 'text-blue-600' },
    { title: 'Inadimplentes', value: stats?.overdueClients ?? 0, icon: AlertTriangle, color: 'text-yellow-600' },
    { title: 'Total TVs', value: stats?.totalTvs ?? 0, icon: Tv, color: 'text-purple-600' },
    { title: 'Receita Mensal', value: formatCurrency(stats?.monthlyRevenue ?? 0), icon: DollarSign, color: 'text-green-600' },
  ];

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      TRIAL: 'info',
      ACTIVE: 'success',
      OVERDUE: 'warning',
      CANCELED: 'secondary',
      BLOCKED: 'destructive',
    };
    return <Badge variant={(variants[status] as any) || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receita (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats?.revenueChart && stats.revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.systemHealth?.map((h) => (
                <div key={h.service} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{h.service}</p>
                    {h.responseTimeMs != null && (
                      <p className="text-xs text-muted-foreground">{h.responseTimeMs}ms</p>
                    )}
                  </div>
                  {h.status === 'healthy' || h.status === 'ok' ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">OK</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">ERROR</span>
                    </div>
                  )}
                </div>
              ))}
              {(!stats?.systemHealth || stats.systemHealth.length === 0) && (
                <p className="text-muted-foreground text-sm">Nenhum serviço monitorado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentClients?.length ? (
                  stats.recentClients.slice(0, 5).map((client: any) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{statusBadge(client.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(client.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentPayments?.length ? (
                  stats.recentPayments.slice(0, 5).map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? 'success' : payment.status === 'PENDING' ? 'info' : 'warning'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(payment.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum pagamento encontrado
                    </TableCell>
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
