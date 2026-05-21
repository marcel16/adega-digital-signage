'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
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
import { useRouter } from 'next/navigation';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  document?: string;
  email?: string;
  phone?: string;
  status: string;
  planType?: string;
  maxStores: number;
  maxTvs: number;
  createdAt: string;
  blockedAt?: string;
  blockedReason?: string;
  trialDays: number;
  primaryColor: string;
}

export default function AdegasPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', document: '', email: '', phone: '',
    primaryColor: '#7c3aed', trialDays: '7',
    maxStores: '1', maxTvs: '1',
  });

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '15');
      const { data: res } = await api.get(`/admin/clients?${params}`);
      setTenants(Array.isArray(res) ? res : res.data || []);
      if (res.meta) setTotalPages(res.meta.totalPages || 1);
    } catch { toast.error('Erro ao carregar adegas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTenants(); }, [page, statusFilter]);

  const resetForm = () => {
    setForm({ name: '', slug: '', document: '', email: '', phone: '', primaryColor: '#7c3aed', trialDays: '7', maxStores: '1', maxTvs: '1' });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast.error('Nome e slug são obrigatórios'); return; }
    try {
      const payload = {
        ...form,
        trialDays: parseInt(form.trialDays),
        maxStores: parseInt(form.maxStores),
        maxTvs: parseInt(form.maxTvs),
      };
      if (editing) {
        await api.patch(`/tenants/${editing.id}`, payload);
        toast.success('Adega atualizada');
      } else {
        await api.post('/tenants', payload);
        toast.success('Adega criada');
      }
      setDialogOpen(false);
      resetForm();
      fetchTenants();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar'); }
  };

  const handleBlock = async (id: string, blocked: boolean, reason?: string) => {
    try {
      await api.patch(`/tenants/${id}/block`, { blocked, blockedReason: reason });
      toast.success(blocked ? 'Adega bloqueada' : 'Adega desbloqueada');
      fetchTenants();
    } catch { toast.error('Erro ao alterar status'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar esta adega? Todas as lojas e TVs associadas serão removidas.')) return;
    try { await api.delete(`/tenants/${id}`); toast.success('Adega deletada'); fetchTenants(); }
    catch { toast.error('Erro ao deletar'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, any> = { TRIAL: 'info', ACTIVE: 'success', OVERDUE: 'warning', CANCELED: 'secondary', BLOCKED: 'destructive' };
    return <Badge variant={map[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Adegas / Lojas (Clientes)</h1>
          <p className="text-muted-foreground">Gerencie os clientes (tenants) da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Cliente</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Slug *</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Documento</Label><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Cor Primária</Label><Input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Dias Trial</Label><Input type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} /></div>
                <div><Label>Máx. Lojas</Label><Input type="number" value={form.maxStores} onChange={(e) => setForm({ ...form, maxStores: e.target.value })} /></div>
                <div><Label>Máx. TVs</Label><Input type="number" value={form.maxTvs} onChange={(e) => setForm({ ...form, maxTvs: e.target.value })} /></div>
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
          <Input placeholder="Buscar por nome, slug, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button onClick={() => { setPage(1); fetchTenants(); }}>Buscar</Button>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
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
        <CardHeader><CardTitle className="text-lg">Clientes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : tenants.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              ) : tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      {t.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{t.slug}</TableCell>
                  <TableCell>{t.email || '-'}</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                  <TableCell>{t.planType || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.maxStores} lojas / {t.maxTvs} TVs</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setForm({ name: t.name, slug: t.slug, document: t.document || '', email: t.email || '', phone: t.phone || '', primaryColor: t.primaryColor, trialDays: String(t.trialDays), maxStores: String(t.maxStores), maxTvs: String(t.maxTvs) }); setDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {t.status !== 'BLOCKED' ? (
                        <Button variant="ghost" size="icon" onClick={() => handleBlock(t.id, true, 'Bloqueado pelo admin')}>
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => handleBlock(t.id, false)}>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
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
