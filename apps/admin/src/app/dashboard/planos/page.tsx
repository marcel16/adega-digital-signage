'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  cycle: string;
  maxStores: number;
  maxTvs: number;
  maxMedia: number;
  maxStorageMb: number;
  active: boolean;
  recommended: boolean;
  sortOrder: number;
  features?: Record<string, boolean>;
}

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', cycle: 'monthly',
    maxStores: '1', maxTvs: '1', maxMedia: '50', maxStorageMb: '500', recommended: false,
  });

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/admin/plans');
      setPlans(Array.isArray(data) ? data.sort((a: Plan, b: Plan) => a.sortOrder - b.sortOrder) : []);
    } catch { toast.error('Erro ao carregar planos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', price: '', cycle: 'monthly', maxStores: '1', maxTvs: '1', maxMedia: '50', maxStorageMb: '500', recommended: false });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.price) { toast.error('Preencha os campos obrigatórios'); return; }
    try {
      const payload = { ...form, price: parseFloat(form.price), maxStores: parseInt(form.maxStores), maxTvs: parseInt(form.maxTvs), maxMedia: parseInt(form.maxMedia), maxStorageMb: parseInt(form.maxStorageMb) };
      if (editing) {
        await api.patch(`/admin/plans/${editing.id}`, payload);
        toast.success('Plano atualizado');
      } else {
        await api.post('/admin/plans', payload);
        toast.success('Plano criado');
      }
      setDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar plano');
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Deletar plano "${plan.name}"?`)) return;
    try {
      await api.delete(`/admin/plans/${plan.id}`);
      toast.success('Plano deletado');
      fetchPlans();
    } catch { toast.error('Erro ao deletar plano (pode haver assinaturas vinculadas)'); }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      await api.patch(`/admin/plans/${plan.id}`, { active: !plan.active });
      toast.success(plan.active ? 'Plano desativado' : 'Plano ativado');
      fetchPlans();
    } catch { toast.error('Erro ao alterar status'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos de assinatura</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Plano</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Plano' : 'Criar Plano'}</DialogTitle>
              <DialogDescription>Preencha os dados do plano de assinatura</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Slug *</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              </div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Preço (R$) *</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Ciclo</Label>
                  <Select value={form.cycle} onValueChange={(v) => setForm({ ...form, cycle: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Máx. Lojas</Label><Input type="number" value={form.maxStores} onChange={(e) => setForm({ ...form, maxStores: e.target.value })} /></div>
                <div><Label>Máx. TVs</Label><Input type="number" value={form.maxTvs} onChange={(e) => setForm({ ...form, maxTvs: e.target.value })} /></div>
                <div><Label>Máx. Mídias</Label><Input type="number" value={form.maxMedia} onChange={(e) => setForm({ ...form, maxMedia: e.target.value })} /></div>
                <div><Label>Storage (MB)</Label><Input type="number" value={form.maxStorageMb} onChange={(e) => setForm({ ...form, maxStorageMb: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="recommended" checked={form.recommended} onCheckedChange={(v) => setForm({ ...form, recommended: v })} />
                <Label htmlFor="recommended">Plano recomendado</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Planos Disponíveis</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum plano cadastrado</TableCell></TableRow>
              ) : plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="text-muted-foreground">{plan.sortOrder}</TableCell>
                  <TableCell className="font-medium">{plan.name} {plan.recommended && <Badge variant="info" className="ml-1">Recomendado</Badge>}</TableCell>
                  <TableCell>{plan.slug}</TableCell>
                  <TableCell>{formatCurrency(plan.price)}</TableCell>
                  <TableCell>{plan.cycle}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{plan.maxStores} lojas / {plan.maxTvs} TVs / {plan.maxStorageMb}MB</TableCell>
                  <TableCell>
                    <Switch checked={plan.active} onCheckedChange={() => toggleActive(plan)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(plan); setForm({ name: plan.name, slug: plan.slug, description: plan.description || '', price: String(plan.price), cycle: plan.cycle, maxStores: String(plan.maxStores), maxTvs: String(plan.maxTvs), maxMedia: String(plan.maxMedia), maxStorageMb: String(plan.maxStorageMb), recommended: plan.recommended }); setDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(plan)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
