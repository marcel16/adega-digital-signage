'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, Ban, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string;
  document?: string;
  phone?: string;
  status: string;
  planType?: string;
  maxStores: number;
  maxTvs: number;
  createdAt: string;
  blockedAt?: string;
  blockedReason?: string;
  _count?: { users: number; stores: number; tvs: number };
}

export default function ClientesPage() {
  const [data, setData] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Tenant | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '15');
      const { data: res } = await api.get(`/admin/clients?${params}`);
      setData(res.data || res);
      if (res.meta) setTotalPages(res.meta.totalPages || Math.ceil(res.meta.total / 15));
    } catch (err) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const handleSearch = () => { setPage(1); fetchData(); };
  const handleBlock = async (id: string, blocked: boolean) => {
    try {
      await api.patch(`/admin/clients/${id}/block`, { blocked, blockedReason: blocked ? blockReason : undefined });
      toast.success(blocked ? 'Cliente bloqueado' : 'Cliente desbloqueado');
      setSelectedClient(null);
      fetchData();
    } catch { toast.error('Erro ao alterar status'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, any> = { TRIAL: 'info', ACTIVE: 'success', OVERDUE: 'warning', CANCELED: 'secondary', BLOCKED: 'destructive' };
    return <Badge variant={map[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Gerencie todos os tenants/clientes da plataforma</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button onClick={handleSearch}>Buscar</Button>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos</SelectItem>
            <SelectItem value="TRIAL">Trial</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="OVERDUE">Inadimplente</SelectItem>
            <SelectItem value="CANCELED">Cancelado</SelectItem>
            <SelectItem value="BLOCKED">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Todos os Clientes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lojas</TableHead>
                <TableHead>TVs</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              ) : data.map((client) => (
                <TableRow key={client.id} className="cursor-pointer" onClick={() => setSelectedClient(client)}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.planType || '-'}</TableCell>
                  <TableCell>{statusBadge(client.status)}</TableCell>
                  <TableCell>{client._count?.stores ?? 0}</TableCell>
                  <TableCell>{client._count?.tvs ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(client.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {client.status !== 'BLOCKED' ? (
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedClient(client); setBlockReason(''); }} title="Bloquear">
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => handleBlock(client.id, false)} title="Desbloquear">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClient && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Detalhes - {selectedClient.name}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}><EyeOff className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><span className="text-sm text-muted-foreground">Slug</span><p>{selectedClient.slug}</p></div>
              <div><span className="text-sm text-muted-foreground">Documento</span><p>{selectedClient.document || '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Email</span><p>{selectedClient.email || '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Telefone</span><p>{selectedClient.phone || '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Status</span><p>{statusBadge(selectedClient.status)}</p></div>
              <div><span className="text-sm text-muted-foreground">Plano</span><p>{selectedClient.planType || '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Máx. Lojas</span><p>{selectedClient.maxStores}</p></div>
              <div><span className="text-sm text-muted-foreground">Máx. TVs</span><p>{selectedClient.maxTvs}</p></div>
            </div>
            {selectedClient.status !== 'BLOCKED' ? (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Bloquear Cliente</h3>
                <Input placeholder="Motivo do bloqueio" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
                <Button variant="destructive" onClick={() => handleBlock(selectedClient.id, true)} disabled={!blockReason}>
                  Bloquear
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Bloqueado em: {selectedClient.blockedAt ? formatDate(selectedClient.blockedAt) : '-'}</p>
                {selectedClient.blockedReason && <p className="text-sm">Motivo: {selectedClient.blockedReason}</p>}
                <Button variant="outline" className="mt-2" onClick={() => handleBlock(selectedClient.id, false)}>
                  Desbloquear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
