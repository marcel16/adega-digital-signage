'use client';

import { useEffect, useState } from 'react';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Plano, Assinatura } from '@/types';

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [assinando, setAssinando] = useState(false);
  const [metodo, setMetodo] = useState('boleto');

  useEffect(() => {
    Promise.all([
      api.get('/pagamentos/planos'),
      api.get('/pagamentos/subscription').catch(() => null),
    ]).then(([p, s]) => {
      setPlanos(p.data.data || p.data || []);
      if (s?.data) setAssinatura(s.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleAssinar = async () => {
    if (!selectedPlano) return;
    setAssinando(true);
    try {
      const { data } = await api.post('/pagamentos/assinar', {
        planoTipo: selectedPlano.slug,
        metodo,
      });
      setAssinatura(data.assinatura);
      setSelectedPlano(null);
      if (data.fatura?.urlBoleto) window.open(data.fatura.urlBoleto, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao assinar');
    } finally {
      setAssinando(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {assinatura && (
        <Card>
          <CardHeader>
            <CardTitle>Plano Atual</CardTitle>
            <CardDescription>Status da sua assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="font-medium capitalize">{assinatura.planoTipo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={assinatura.status === 'active' ? 'default' : 'secondary'}>
                  {assinatura.status === 'active' ? 'Ativo' : assinatura.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium">{formatCurrency(Number(assinatura.valor))}/mês</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Desde</p>
                <p className="font-medium">{new Date(assinatura.dataInicio).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            {assinatura.faturas?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Últimas Faturas</h4>
                {assinatura.faturas.map((fat) => (
                  <div key={fat.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{new Date(fat.dataVencimento).toLocaleDateString('pt-BR')}</span>
                    <span>{formatCurrency(Number(fat.valor))}</span>
                    <Badge variant={fat.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                      {fat.status === 'paid' ? 'Pago' : fat.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {planos.map((plano) => {
          const recursos = typeof plano.recursos === 'string' ? JSON.parse(plano.recursos || '[]') : (plano.recursos || []);
          return (
            <Card key={plano.id} className={plano.destaque ? 'border-primary ring-2 ring-primary' : ''}>
              <CardHeader>
                {plano.destaque && <Badge className="w-fit mb-2">Mais Popular</Badge>}
                <CardTitle>{plano.nome}</CardTitle>
                <CardDescription>{plano.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  {plano.valor === 0 ? 'Grátis' : formatCurrency(Number(plano.valor))}
                  {plano.valor > 0 && <span className="text-lg text-muted-foreground">/mês</span>}
                </div>
                <Separator />
                <ul className="space-y-2">
                  {Array.isArray(recursos) && recursos.map((rec: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {rec}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Até {plano.maxEstabelecimentos} estabelecimento{plano.maxEstabelecimentos > 1 ? 's' : ''}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Até {plano.maxTvs} TV{plano.maxTvs > 1 ? 's' : ''}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {plano.maxMidias} mídias
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plano.destaque ? 'default' : 'outline'}
                  onClick={() => setSelectedPlano(plano)}
                  disabled={plano.valor === 0}
                >
                  {plano.valor === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedPlano} onOpenChange={(o) => !o && setSelectedPlano(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinar {selectedPlano?.nome}</DialogTitle>
            <DialogDescription>
              {selectedPlano && formatCurrency(Number(selectedPlano.valor))}/mês
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAssinar} disabled={assinando}>
              {assinando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Confirmar Assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}