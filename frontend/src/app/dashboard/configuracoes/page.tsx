'use client';

import { useEffect, useState } from 'react';
import { User, Building, Shield, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';

export default function ConfiguracoesPage() {
  const [profile, setProfile] = useState({ nome: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/profile').then(({ data }) => {
      setProfile({ nome: data.nome, email: data.email });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { nome: profile.nome });
      localStorage.setItem('userNome', profile.nome);
      alert('Perfil atualizado!');
    } catch {
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil"><User className="h-4 w-4 mr-2" />Perfil</TabsTrigger>
          <TabsTrigger value="conta"><Building className="h-4 w-4 mr-2" />Conta</TabsTrigger>
          <TabsTrigger value="seguranca"><Shield className="h-4 w-4 mr-2" />Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={profile.nome} onChange={(e) => setProfile({ ...profile, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Save className="h-4 w-4 mr-2" /> Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conta" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Plano atual</p>
                  <p className="text-sm text-muted-foreground">Profissional</p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard/planos'}>
                  Ver Planos
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Membros da equipe</p>
                  <p className="text-sm text-muted-foreground">Gerencie usuários do seu tenant</p>
                </div>
                <Button variant="outline">Gerenciar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input type="password" />
              </div>
              <Button>Alterar Senha</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}