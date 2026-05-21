'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Eye, Plus } from 'lucide-react';

interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  fee: number;
  status: string;
  paymentMethod?: string;
  description?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
  tenant?: { name: string; email: string };
}

export default function PagamentosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState({ tenantId: '', amount: '', description: '', dueDate: '' });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '15');
      const { data: res } = await api.get(`/admin/payments?${params}`);
      setPayments(res.data || res);
      if (res.meta) setTotalPages(res.meta.totalPages || 1);
    } catch { toast.error('Erro ao carregar pagamentos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, [page, statusFilter]);

  const statusBadge = (status: string) => {
    const map: Record<string, any> = { PENDING: 'info', CONFIRMED: 'info', RECEIVED: 'success', CANCELED: 'destructive', REFUNDED: 'warning', CHARGEBACK: 'destructive' };
    return <Badge variant={map[status] || 'outline'}>{status}</Badge>;
  };

  const handleCreatePayment = async () => {
    if (!form.tenantId || !form.amount) { toast.error('Preencha os campos obrigatórios'); return; }
    try {
      await api.post('/payments', { ...form, amount: parseFloat(form.amount) });
      toast.success('Pagamento criado');
      setCreateDialog(false);
      setForm({ tenantId: '', amount: '', description: '', dueDate: '' });
      fetchPayments();
    } catch { toast.error('Erro ao criar pagamento'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pagamentos</h1>
          <p className="text-muted-foreground">Histórico de pagamentos e transações</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}><Plus className="h-4 w-4 mr-2" />Criar Fatura</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button onClick={() => { setPage(1); fetchPayments(); }}>Buscar</Button>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); fetchPayments(); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="CONFIRMED">Confirmado</SelectItem>
            <SelectItem value="RECEIVED">Recebido</SelectItem>
            <SelectItem value="CANCELED">Cancelado</SelectItem>
            <SelectItem value="REFUNDED">Reembolsado</SelectItem>
            <SelectItem value="CHARGEBACK">Chargeback</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Transações</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum pagamento encontrado</TableCell></TableRow>
              ) : payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.tenant?.name || p.tenantId}</TableCell>
                  <TableCell>{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(p.fee)}</TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell>{p.paymentMethod || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedPayment(p)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Pagamento</DialogTitle></DialogHeader>
          {selectedPayment && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Valor</span><p className="font-medium">{formatCurrency(selectedPayment.amount)}</p></div>
                <div><span className="text-sm text-muted-foreground">Taxa</span><p>{formatCurrency(selectedPayment.fee)}</p></div>
                <div><span className="text-sm text-muted-foreground">Status</span><p>{statusBadge(selectedPayment.status)}</p></div>
                <div><span className="text-sm text-muted-foreground">Método</span><p>{selectedPayment.paymentMethod || '-'}</p></div>
              </div>
              <div><span className="text-sm text-muted-foreground">Descrição</span><p>{selectedPayment.description || '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Vencimento</span><p>{selectedPayment.dueDate ? formatDate(selectedPayment.dueDate) : '-'}</p></div>
              <div><span className="text-sm text-muted-foreground">Pago em</span><p>{selectedPayment.paidAt ? formatDate(selectedPayment.paidAt) : '-'}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createDialog} onOpenChange={(v) => { setCreateDialog(v); if (!v) setForm({ tenantId: '', amount: '', description: '', dueDate: '' }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Fatura Manual</DialogTitle><DialogDescription>Crie uma fatura para testes</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>ID do Cliente (Tenant)</Label><Input value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} placeholder="UUID do tenant" /></div>
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Data de Vencimento</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreatePayment}>Criar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
