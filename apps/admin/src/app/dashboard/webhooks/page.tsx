'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

interface WebhookLog {
  id: string;
  provider: string;
  event: string;
  payload?: any;
  headers?: any;
  ip?: string;
  status?: number;
  response?: string;
  processed: boolean;
  error?: string;
  createdAt: string;
  tenant?: { name: string };
}

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (providerFilter) params.set('provider', providerFilter);
      if (eventFilter) params.set('event', eventFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');
      const { data: res } = await api.get(`/webhook-logs?${params}`);
      setLogs(res.data || res);
      if (res.meta) setTotalPages(res.meta.totalPages || 1);
    } catch { toast.error('Erro ao carregar webhooks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, providerFilter, eventFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">Histórico de chamadas de webhook</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchLogs}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Provedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos</SelectItem>
            <SelectItem value="asaas">Asaas</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
            <SelectItem value="mercadopago">Mercado Pago</SelectItem>
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={(v) => { setEventFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Evento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos</SelectItem>
            <SelectItem value="payment_received">Pagamento Recebido</SelectItem>
            <SelectItem value="payment_confirmed">Pagamento Confirmado</SelectItem>
            <SelectItem value="subscription_created">Assinatura Criada</SelectItem>
            <SelectItem value="subscription_canceled">Assinatura Cancelada</SelectItem>
            <SelectItem value="invoice_created">Fatura Criada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status HTTP" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos</SelectItem>
            <SelectItem value="200">200 OK</SelectItem>
            <SelectItem value="201">201 Created</SelectItem>
            <SelectItem value="400">400 Bad Request</SelectItem>
            <SelectItem value="500">500 Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Webhooks Recebidos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Processado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum webhook encontrado</TableCell></TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                  <TableCell className="font-medium">{log.provider}</TableCell>
                  <TableCell><Badge variant="outline">{log.event}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={log.status && log.status < 300 ? 'success' : 'destructive'}>
                      {log.status || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{log.ip || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={log.processed ? 'success' : 'warning'}>{log.processed ? 'Sim' : 'Não'}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.error && <span className="text-xs text-destructive cursor-help" title={log.error}>Erro</span>}
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

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Payload do Webhook</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Provedor</span><p className="font-medium">{selectedLog.provider}</p></div>
                <div><span className="text-sm text-muted-foreground">Evento</span><p>{selectedLog.event}</p></div>
                <div><span className="text-sm text-muted-foreground">IP</span><p>{selectedLog.ip || '-'}</p></div>
                <div><span className="text-sm text-muted-foreground">Status</span><p>{selectedLog.status || '-'}</p></div>
              </div>
              {selectedLog.error && (
                <div>
                  <span className="text-sm text-muted-foreground text-destructive">Erro</span>
                  <p className="text-sm text-destructive">{selectedLog.error}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Headers</span>
                <pre className="mt-1 rounded bg-muted p-3 text-xs overflow-auto max-h-40">
                  {JSON.stringify(selectedLog.headers || {}, null, 2)}
                </pre>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Payload</span>
                <pre className="mt-1 rounded bg-muted p-3 text-xs overflow-auto max-h-60">
                  {JSON.stringify(selectedLog.payload || {}, null, 2)}
                </pre>
              </div>
              {selectedLog.response && (
                <div>
                  <span className="text-sm text-muted-foreground">Resposta</span>
                  <pre className="mt-1 rounded bg-muted p-3 text-xs overflow-auto max-h-40">{selectedLog.response}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
