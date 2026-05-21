'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Search, Ban, CheckCircle2, Store } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  status: string;
  phone?: string;
  managerName?: string;
  tenantId: string;
  tenant?: { name: string; slug: string };
  createdAt: string;
  _count?: { tvs: number };
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreItem | null>(null);
  const [form, setForm] = useState({
    name: '', code: '', document: '', phone: '', city: '', state: '', managerName: '', managerPhone: '',
    address: '', openingTime: '', closingTime: '',
  });

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '15');
      const { data: res } = await api.get(`/admin/stores?${params}`);
      setStores(Array.isArray(res) ? res : res.data || []);
      if (res.meta) setTotalPages(res.meta.totalPages || 1);
    } catch { toast.error('Erro ao carregar estabelecimentos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStores(); }, [page, statusFilter]);

  const resetForm = () => {
    setForm({ name: '', code: '', document: '', phone: '', city: '', state: '', managerName: '', managerPhone: '', address: '', openingTime: '', closingTime: '' });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Nome e código são obrigatórios'); return; }
    try {
      if (editing) {
        await api.patch(`/stores/${editing.id}`, form);
        toast.success('Estabelecimento atualizado');
      } else {
        await api.post('/stores', form);
        toast.success('Estabelecimento criado');
      }
      setDialogOpen(false);
      resetForm();
      fetchStores();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar este estabelecimento?')) return;
    try { await api.delete(`/stores/${id}`); toast.success('Deletado'); fetchStores(); }
    catch { toast.error('Erro ao deletar'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, any> = { ACTIVE: 'success', INACTIVE: 'secondary', BLOCKED: 'destructive' };
    return <Badge variant={map[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estabelecimentos</h1>
          <p className="text-muted-foreground">Todos os estabelecimentos da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Estabelecimento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Estabelecimento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Código *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Documento</Label><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>Estado</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              </div>
              <div><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Gerente</Label><Input value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} /></div>
                <div><Label>Tel. Gerente</Label><Input value={form.managerPhone} onChange={(e) => setForm({ ...form, managerPhone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Abertura</Label><Input type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} /></div>
                <div><Label>Fechamento</Label><Input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button onClick={() => { setPage(1); fetchStores(); }}>Buscar</Button>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="INACTIVE">Inativo</SelectItem>
            <SelectItem value="BLOCKED">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Estabelecimentos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Cidade/Estado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TVs</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : stores.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum estabelecimento encontrado</TableCell></TableRow>
              ) : stores.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell>{s.city ? `${s.city}/${s.state}` : '-'}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell>{s._count?.tvs ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.tenant?.name || s.tenantId.substring(0, 8)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDate(s.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setForm({ name: s.name, code: s.code, document: s.document || '', phone: s.phone || '', city: s.city || '', state: s.state || '', managerName: s.managerName || '', managerPhone: s.managerPhone || '', address: s.address || '', openingTime: s.openingTime || '', closingTime: s.closingTime || '' }); setDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
    </div>
  );
}
