'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  minValue?: number;
  maxDiscount?: number;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
  planSlug?: string;
  firstTimeOnly: boolean;
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '',
    minValue: '', maxDiscount: '', validFrom: '', validUntil: '', planSlug: '', firstTimeOnly: false, description: '',
  });

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons');
      setCoupons(Array.isArray(data) ? data : data.data || []);
    } catch { toast.error('Erro ao carregar cupons'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const resetForm = () => {
    setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', minValue: '', maxDiscount: '', validFrom: '', validUntil: '', planSlug: '', firstTimeOnly: false, description: '' });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue) { toast.error('Preencha código e valor'); return; }
    try {
      const payload = {
        ...form,
        discountValue: parseFloat(form.discountValue),
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        minValue: form.minValue ? parseFloat(form.minValue) : undefined,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
      };
      if (editing) {
        await api.patch(`/coupons/${editing.id}`, payload);
        toast.success('Cupom atualizado');
      } else {
        await api.post('/coupons', payload);
        toast.success('Cupom criado');
      }
      setDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar cupom'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar cupom?')) return;
    try { await api.delete(`/coupons/${id}`); toast.success('Cupom deletado'); fetchCoupons(); }
    catch { toast.error('Erro ao deletar cupom'); }
  };

  const toggleActive = async (coupon: Coupon) => {
    try { await api.patch(`/coupons/${coupon.id}`, { active: !coupon.active }); fetchCoupons(); }
    catch { toast.error('Erro ao alterar status'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupons</h1>
          <p className="text-muted-foreground">Gerencie cupons de desconto</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Cupom</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Cupom' : 'Criar Cupom'}</DialogTitle>
              <DialogDescription>Configure o cupom de desconto</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Código *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PROMO20" /></div>
                <div><Label>Tipo</Label>
                  <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                      <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Valor *</Label><Input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></div>
                <div><Label>Usos Máximos</Label><Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Valor Mínimo</Label><Input type="number" step="0.01" value={form.minValue} onChange={(e) => setForm({ ...form, minValue: e.target.value })} /></div>
                <div><Label>Desconto Máx.</Label><Input type="number" step="0.01" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Válido de</Label><Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></div>
                <div><Label>Válido até</Label><Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></div>
              </div>
              <div><Label>Plano (slug)</Label><Input value={form.planSlug} onChange={(e) => setForm({ ...form, planSlug: e.target.value })} placeholder="Deixar vazio para todos" /></div>
              <div className="flex items-center gap-2">
                <Switch id="firstTime" checked={form.firstTimeOnly} onCheckedChange={(v) => setForm({ ...form, firstTimeOnly: v })} />
                <Label htmlFor="firstTime">Apenas primeiro acesso</Label>
              </div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Cupons</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Válido até</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum cupom cadastrado</TableCell></TableRow>
              ) : coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>{c.discountType === 'PERCENTAGE' ? 'Percentual' : 'Fixo'}</TableCell>
                  <TableCell>{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}</TableCell>
                  <TableCell>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</TableCell>
                  <TableCell className="text-muted-foreground">{c.validUntil ? formatDate(c.validUntil) : '-'}</TableCell>
                  <TableCell><Switch checked={c.active} onCheckedChange={() => toggleActive(c)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setForm({ code: c.code, discountType: c.discountType, discountValue: String(c.discountValue), maxUses: c.maxUses ? String(c.maxUses) : '', minValue: c.minValue ? String(c.minValue) : '', maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', validFrom: c.validFrom ? c.validFrom.split('T')[0] : '', validUntil: c.validUntil ? c.validUntil.split('T')[0] : '', planSlug: c.planSlug || '', firstTimeOnly: c.firstTimeOnly, description: c.description || '' }); setDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
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
