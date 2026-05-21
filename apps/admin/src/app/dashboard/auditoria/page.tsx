'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entity?: string;
  entityId?: string;
  userId: string;
  tenantId: string;
  metadata?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  user?: { name: string; email: string };
  tenant?: { name: string };
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity', entityFilter);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '20');
      const { data: res } = await api.get(`/audit?${params}`);
      setLogs(res.data || res);
      if (res.meta) setTotalPages(res.meta.totalPages || 1);
    } catch { toast.error('Erro ao carregar auditoria'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter, entityFilter]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity', entityFilter);
      if (search) params.set('search', search);
      params.set('format', 'csv');
      const { data } = await api.get(`/audit/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log.csv';
      a.click();
      toast.success('Arquivo exportado');
    } catch { toast.error('Erro ao exportar'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auditoria</h1>
          <p className="text-muted-foreground">Logs detalhados de auditoria do sistema</p>
        </div>
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <Button onClick={() => { setPage(1); fetchLogs(); }}>Buscar</Button>
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todas</SelectItem>
            <SelectItem value="CREATE">Criação</SelectItem>
            <SelectItem value="UPDATE">Atualização</SelectItem>
            <SelectItem value="DELETE">Exclusão</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
            <SelectItem value="LOGOUT">Logout</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Entidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todas</SelectItem>
            <SelectItem value="tenant">Cliente</SelectItem>
            <SelectItem value="store">Loja</SelectItem>
            <SelectItem value="tv">TV</SelectItem>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="plan">Plano</SelectItem>
            <SelectItem value="subscription">Assinatura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Registros de Auditoria</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>IP</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                  <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                  <TableCell>{log.entity || '-'}</TableCell>
                  <TableCell>{log.user?.name || log.userId}</TableCell>
                  <TableCell className="text-xs">{log.tenant?.name || log.tenantId?.substring(0, 8)}</TableCell>
                  <TableCell className="text-xs font-mono">{log.ip || '-'}</TableCell>
                  <TableCell>
                    {log.metadata ? <ChevronDown className="h-4 w-4" /> : null}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes do Registro</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Ação</span><p className="font-medium">{selectedLog.action}</p></div>
                <div><span className="text-sm text-muted-foreground">Entidade</span><p>{selectedLog.entity || '-'}</p></div>
                <div><span className="text-sm text-muted-foreground">ID Entidade</span><p className="text-xs font-mono">{selectedLog.entityId || '-'}</p></div>
                <div><span className="text-sm text-muted-foreground">IP</span><p className="text-xs font-mono">{selectedLog.ip || '-'}</p></div>
                <div><span className="text-sm text-muted-foreground">Usuário</span><p>{selectedLog.user?.name} ({selectedLog.user?.email})</p></div>
                <div><span className="text-sm text-muted-foreground">Tenant</span><p>{selectedLog.tenant?.name || '-'}</p></div>
              </div>
              <div><span className="text-sm text-muted-foreground">User Agent</span><p className="text-xs break-all">{selectedLog.userAgent || '-'}</p></div>
              {selectedLog.metadata && (
                <div>
                  <span className="text-sm text-muted-foreground">Metadados (JSON)</span>
                  <pre className="mt-1 rounded bg-muted p-3 text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
