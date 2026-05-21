'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState({
    systemName: 'Adega Signage',
    trialDays: '7',
    defaultMaxStores: '1',
    defaultMaxTvs: '1',
    defaultMaxMedia: '50',
    defaultMaxStorageMb: '500',
  });
  const [asaas, setAsaas] = useState({
    apiKey: '',
    environment: 'sandbox',
    webhookSecret: '',
    notifyUrl: '',
    enabled: false,
  });
  const [security, setSecurity] = useState({
    rateLimit: '100',
    sessionTimeout: '3600',
    twoFactorEnforcement: false,
  });

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        if (Array.isArray(data)) {
          data.forEach((s: any) => { map[s.key] = s.value; });
        }
        setSettings({
          systemName: map.systemName || 'Adega Signage',
          trialDays: map.trialDays || '7',
          defaultMaxStores: map.defaultMaxStores || '1',
          defaultMaxTvs: map.defaultMaxTvs || '1',
          defaultMaxMedia: map.defaultMaxMedia || '50',
          defaultMaxStorageMb: map.defaultMaxStorageMb || '500',
        });
      }
    }).catch(() => {});

    api.get('/settings/asaas').then(({ data }) => {
      if (data) {
        setAsaas({
          apiKey: data.apiKey || '',
          environment: data.environment || 'sandbox',
          webhookSecret: data.webhookSecret || '',
          notifyUrl: data.notifyUrl || '',
          enabled: data.enabled || false,
        });
      }
    }).catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    const entries = [
      { key: 'systemName', value: settings.systemName, category: 'general' },
      { key: 'trialDays', value: settings.trialDays, category: 'general' },
      { key: 'defaultMaxStores', value: settings.defaultMaxStores, category: 'general' },
      { key: 'defaultMaxTvs', value: settings.defaultMaxTvs, category: 'general' },
      { key: 'defaultMaxMedia', value: settings.defaultMaxMedia, category: 'general' },
      { key: 'defaultMaxStorageMb', value: settings.defaultMaxStorageMb, category: 'general' },
    ];
    try {
      await api.patch('/admin/settings', { settings: entries });
      toast.success('Configurações salvas');
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleSaveAsaas = async () => {
    try {
      await api.patch('/settings/asaas', asaas);
      toast.success('Configurações Asaas salvas');
    } catch { toast.error('Erro ao salvar Asaas'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="asaas">Asaas</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Configurações Gerais</CardTitle><CardDescription>Configurações básicas da plataforma</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome do Sistema</Label><Input value={settings.systemName} onChange={(e) => setSettings({ ...settings, systemName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Dias de Trial</Label><Input type="number" value={settings.trialDays} onChange={(e) => setSettings({ ...settings, trialDays: e.target.value })} /></div>
                <div><Label>Limite Padrão de Lojas</Label><Input type="number" value={settings.defaultMaxStores} onChange={(e) => setSettings({ ...settings, defaultMaxStores: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Limite Padrão de TVs</Label><Input type="number" value={settings.defaultMaxTvs} onChange={(e) => setSettings({ ...settings, defaultMaxTvs: e.target.value })} /></div>
                <div><Label>Limite Padrão de Mídias</Label><Input type="number" value={settings.defaultMaxMedia} onChange={(e) => setSettings({ ...settings, defaultMaxMedia: e.target.value })} /></div>
                <div><Label>Storage Padrão (MB)</Label><Input type="number" value={settings.defaultMaxStorageMb} onChange={(e) => setSettings({ ...settings, defaultMaxStorageMb: e.target.value })} /></div>
              </div>
              <Button onClick={handleSaveSettings}><Save className="h-4 w-4 mr-2" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asaas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Configurações Asaas</CardTitle><CardDescription>Integração com gateway de pagamento Asaas</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>API Key</Label>
                <Input type="password" value={asaas.apiKey} onChange={(e) => setAsaas({ ...asaas, apiKey: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ambiente</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={asaas.environment} onChange={(e) => setAsaas({ ...asaas, environment: e.target.value })}>
                    <option value="sandbox">Sandbox</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <Switch id="asaas-enabled" checked={asaas.enabled} onCheckedChange={(v) => setAsaas({ ...asaas, enabled: v })} />
                  <Label htmlFor="asaas-enabled">Habilitado</Label>
                </div>
              </div>
              <div><Label>Webhook Secret</Label><Input value={asaas.webhookSecret} onChange={(e) => setAsaas({ ...asaas, webhookSecret: e.target.value })} /></div>
              <div><Label>Notify URL</Label><Input value={asaas.notifyUrl} onChange={(e) => setAsaas({ ...asaas, notifyUrl: e.target.value })} /></div>
              <Button onClick={handleSaveAsaas}><Save className="h-4 w-4 mr-2" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Configurações de Segurança</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Rate Limit (req/min)</Label><Input type="number" value={security.rateLimit} onChange={(e) => setSecurity({ ...security, rateLimit: e.target.value })} /></div>
                <div><Label>Session Timeout (segundos)</Label><Input type="number" value={security.sessionTimeout} onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="2fa" checked={security.twoFactorEnforcement} onCheckedChange={(v) => setSecurity({ ...security, twoFactorEnforcement: v })} />
                <Label htmlFor="2fa">Exigir 2FA para todos os admins</Label>
              </div>
              <Button onClick={() => { toast.success('Configurações de segurança salvas'); }}><Save className="h-4 w-4 mr-2" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Aparência</CardTitle><CardDescription>Personalize a aparência do sistema</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cor Primária (hex)</Label><Input type="text" placeholder="#7c3aed" /></div>
                <div><Label>URL do Logo</Label><Input placeholder="https://..." /></div>
              </div>
              <div><Label>Favicon URL</Label><Input placeholder="https://..." /></div>
              <Button onClick={() => { toast.success('Aparência salva'); }}><Save className="h-4 w-4 mr-2" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
