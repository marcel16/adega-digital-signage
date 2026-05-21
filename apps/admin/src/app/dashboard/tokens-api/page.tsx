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
import { Plus, Key, Copy, Trash2 } from 'lucide-react';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  scope: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

const SCOPES = [
  { value: 'FULL_ACCESS', label: 'Acesso Total' },
  { value: 'READ_ONLY', label: 'Apenas Leitura' },
  { value: 'STORES', label: 'Lojas' },
  { value: 'TVS', label: 'TVs' },
  { value: 'MEDIA', label: 'Mídias' },
  { value: 'PLAYLISTS', label: 'Playlists' },
  { value: 'SCHEDULES', label: 'Agendamentos' },
  { value: 'BILLING', label: 'Cobrança' },
  { value: 'IPTV', label: 'IPTV' },
];

export default function TokensApiPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', scope: 'READ_ONLY' });

  const fetchTokens = async () => {
    try {
      const { data } = await api.get('/api-tokens');
      setTokens(Array.isArray(data) ? data : data.data || []);
    } catch { toast.error('Erro ao carregar tokens'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTokens(); }, []);

  const handleCreate = async () => {
    if (!form.name) { toast.error('Informe um nome para o token'); return; }
    try {
      const { data } = await api.post('/api-tokens', form);
      setNewToken(data.token);
      toast.success('Token criado! Copie-o agora, ele não será mostrado novamente.');
      setDialogOpen(false);
      setForm({ name: '', scope: 'READ_ONLY' });
      fetchTokens();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao criar token'); }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revogar este token? Esta ação não pode ser desfeita.')) return;
    try { await api.delete(`/api-tokens/${id}`); toast.success('Token revogado'); fetchTokens(); }
    catch { toast.error('Erro ao revogar token'); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return token;
    return token.substring(0, 4) + '••••' + token.substring(token.length - 4);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tokens API</h1>
          <p className="text-muted-foreground">Gerencie tokens de acesso à API</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Token</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Token</DialogTitle><DialogDescription>Gere um novo token de acesso à API</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome do Token</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Meu token de integração" /></div>
              <div><Label>Escopo</Label>
                <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCOPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Gerar Token</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {newToken && (
        <Card className="border-green-500">
          <CardHeader><CardTitle className="text-lg text-green-600 flex items-center gap-2"><Key className="h-5 w-5" />Token Gerado</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted p-3 text-sm font-mono break-all">{newToken}</code>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(newToken)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Copie este token agora. Ele não será exibido novamente.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Tokens</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Último Uso</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum token encontrado</TableCell></TableRow>
              ) : tokens.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{maskToken(t.token)}</code>
                  </TableCell>
                  <TableCell><Badge variant="outline">{SCOPES.find(s => s.value === t.scope)?.label || t.scope}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{t.lastUsedAt ? formatDate(t.lastUsedAt) : 'Nunca'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{t.expiresAt ? formatDate(t.expiresAt) : 'Não expira'}</TableCell>
                  <TableCell>
                    <Badge variant={t.isActive ? 'success' : 'destructive'}>{t.isActive ? 'Ativo' : 'Revogado'}</Badge>
                  </TableCell>
                  <TableCell>
                    {t.isActive && (
                      <Button variant="ghost" size="icon" onClick={() => handleRevoke(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
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
