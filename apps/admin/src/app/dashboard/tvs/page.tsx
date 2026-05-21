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
import { Plus, Edit2, Trash2, Search, Monitor, Key } from 'lucide-react';

interface TvItem {
  id: string;
  name: string;
  pairingCode: string;
  status: string;
  model?: string;
  ipAddress?: string;
  lastPingAt?: string;
  orientation: string;
  storeId: string;
  store?: { name: string; code: string };
  tenantId: string;
  token: string;
  createdAt: string;
}

export default function TvsPage() {
  const [tvs, setTvs] = useState<TvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TvItem | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', model: '', resolution: '', orientation: 'HORIZONTAL',
    storeId: '', volume: '50', autoRotate: 'true', rotateInterval: '15',
  });
  const [showToken, setShowToken] = useState<string | null>(null);

  const fetchTvs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '15');
      const { data: res } = await api.get(`/admin/tvs?${params}`);
      setTvs(Array.isArray(res) ? res : res.data || []);
      if (res.meta) setTotalPages(res.meta.totalPages || 1);
    } catch { toast.error('Erro ao carregar TVs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTvs(); }, [page, statusFilter]);

  const resetForm = () => {
    setForm({ name: '', description: '', model: '', resolution: '', orientation: 'HORIZONTAL', storeId: '', volume: '50', autoRotate: 'true', rotateInterval: '15' });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.storeId) { toast.error('Nome e loja são obrigatórios'); return; }
    try {
      const payload = { ...form, volume: parseInt(form.volume), rotateInterval: parseInt(form.rotateInterval), autoRotate: form.autoRotate === 'true' };
      if (editing) {
        await api.patch(`/tvs/${editing.id}`, payload);
        toast.success('TV atualizada');
      } else {
        const { data } = await api.post('/tvs', payload);
        if (data.token) setShowToken(data.token);
        toast.success('TV criada!');
      }
      setDialogOpen(false);
      resetForm();
      fetchTvs();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar esta TV?')) return;
    try { await api.delete(`/tvs/${id}`); toast.success('TV deletada'); fetchTvs(); }
    catch { toast.error('Erro ao deletar'); }
  };

  const handlePair = async (id: string) => {
    try {
      const { data } = await api.post(`/tvs/${id}/pair`);
      toast.success(`Novo código de pareamento: ${data.pairingCode}`);
      fetchTvs();
    } catch { toast.error('Erro ao gerar código'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, any> = { ONLINE: 'success', OFFLINE: 'secondary', PAUSED: 'warning', ERROR: 'destructive' };
    return <Badge variant={map[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TVs</h1>
          <p className="text-muted-foreground">Gerencie todos os dispositivos TV</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova TV</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} TV</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>ID da Loja *</Label><Input value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} /></div>
              </div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Modelo</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
                <div><Label>Resolução</Label>
                  <Select value={form.resolution} onValueChange={(v) => setForm({ ...form, resolution: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                      <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                      <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Orientação</Label>
                  <Select value={form.orientation} onValueChange={(v) => setForm({ ...form, orientation: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HORIZONTAL">Horizontal</SelectItem>
                      <SelectItem value="VERTICAL">Vertical</SelectItem>
                      <SelectItem value="BOTH">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Volume</Label><Input type="number" min="0" max="100" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Auto Rotação</Label>
                  <Select value={form.autoRotate} onValueChange={(v) => setForm({ ...form, autoRotate: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Intervalo (min)</Label><Input type="number" value={form.rotateInterval} onChange={(e) => setForm({ ...form, rotateInterval: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {showToken && (
        <Card className="border-green-500">
          <CardHeader><CardTitle className="text-lg text-green-600 flex items-center gap-2"><Key className="h-5 w-5" />Token da TV</CardTitle></CardHeader>
          <CardContent>
            <code className="block rounded bg-muted p-3 text-sm font-mono break-all">{showToken}</code>
            <p className="text-sm text-muted-foreground mt-2">Copie este token para configurar a TV.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => { navigator.clipboard.writeText(showToken); toast.success('Copiado!'); }}>
              Copiar Token
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button onClick={() => { setPage(1); fetchTvs(); }}>Buscar</Button>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos</SelectItem>
            <SelectItem value="ONLINE">Online</SelectItem>
            <SelectItem value="OFFLINE">Offline</SelectItem>
            <SelectItem value="PAUSED">Pausado</SelectItem>
            <SelectItem value="ERROR">Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Dispositivos TV</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Orientação</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Último Ping</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : tvs.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhuma TV encontrada</TableCell></TableRow>
              ) : tvs.map((tv) => (
                <TableRow key={tv.id}>
                  <TableCell className="font-medium">{tv.name}</TableCell>
                  <TableCell className="font-mono text-xs">{tv.pairingCode}</TableCell>
                  <TableCell>{statusBadge(tv.status)}</TableCell>
                  <TableCell>{tv.model || '-'}</TableCell>
                  <TableCell>{tv.orientation}</TableCell>
                  <TableCell className="text-xs">{tv.store?.name || tv.storeId.substring(0, 8)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{tv.lastPingAt ? formatDate(tv.lastPingAt) : 'Nunca'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handlePair(tv.id)} title="Novo código">
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(tv); setForm({ name: tv.name, description: tv.description || '', model: tv.model || '', resolution: tv.resolution || '', orientation: tv.orientation, storeId: tv.storeId, volume: String(tv.volume), autoRotate: String(tv.autoRotate), rotateInterval: String(tv.rotateInterval) }); setDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tv.id)}>
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
