'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Film,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Campanha, CampanhaMidia, Estabelecimento, Midia, PaginatedResponse } from '@/types';
import { CampanhaForm, type CampanhaFormValues, TIPO_OPTIONS } from '@/components/forms/campanha-form';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  active: { label: 'Ativa', className: 'bg-green-100 text-green-800 border-green-200' },
  paused: { label: 'Pausada', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  completed: { label: 'Concluída', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  canceled: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border-red-200' },
};

const tipoLabelMap: Record<string, string> = {};
for (const opt of TIPO_OPTIONS) {
  tipoLabelMap[opt.value] = opt.label;
}

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<Campanha>['meta'] | null>(null);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campanha | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [midiaDialogOpen, setMidiaDialogOpen] = useState(false);
  const [midiaCampanhaId, setMidiaCampanhaId] = useState<string | null>(null);
  const [midiaCampanhaNome, setMidiaCampanhaNome] = useState('');
  const [campanhaMidias, setCampanhaMidias] = useState<CampanhaMidia[]>([]);
  const [availableMidias, setAvailableMidias] = useState<Midia[]>([]);
  const [midiasLoading, setMidiasLoading] = useState(false);
  const [selectedAddMidiaId, setSelectedAddMidiaId] = useState('');
  const [addMidiaOrdem, setAddMidiaOrdem] = useState(0);
  const [addMidiaDuracao, setAddMidiaDuracao] = useState('');
  const [addMidiaLoading, setAddMidiaLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Campanha | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const estabelecimentoMap = new Map(estabelecimentos.map((e) => [e.id, e]));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<PaginatedResponse<Campanha>>('/campanhas', { params });
      setCampanhas(data.data);
      setMeta(data.meta);
    } catch {
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchEstabelecimentos = useCallback(async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Estabelecimento>>('/estabelecimentos', {
        params: { limit: 200 },
      });
      setEstabelecimentos(data.data);
    } catch {
      setEstabelecimentos([]);
    }
  }, []);

  useEffect(() => {
    fetchEstabelecimentos();
  }, [fetchEstabelecimentos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === '_all' ? '' : value);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (campanha: Campanha) => {
    setEditing(campanha);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: CampanhaFormValues) => {
    setFormLoading(true);
    try {
      if (editing) {
        await api.put(`/campanhas/${editing.id}`, values);
        toast.success('Campanha atualizada com sucesso!');
        setDialogOpen(false);
        fetchData();
      } else {
        const payload: Record<string, unknown> = { ...values };
        if (!payload.estabelecimentoId) delete payload.estabelecimentoId;
        const { data } = await api.post<Campanha>('/campanhas', payload);
        toast.success('Campanha criada com sucesso!');
        setDialogOpen(false);
        fetchData();
        setMidiaCampanhaId(data.id);
        setMidiaCampanhaNome(data.nome);
        openMidiaDialog(data.id);
      }
    } catch {
      toast.error(editing ? 'Erro ao atualizar campanha' : 'Erro ao criar campanha');
    } finally {
      setFormLoading(false);
    }
  };

  const openMidiaDialog = async (campanhaId: string) => {
    setMidiaDialogOpen(true);
    await Promise.all([fetchCampanhaMidias(campanhaId), fetchAvailableMidias()]);
  };

  const openMidiaManagement = async (campanha: Campanha) => {
    setMidiaCampanhaId(campanha.id);
    setMidiaCampanhaNome(campanha.nome);
    setMidiaDialogOpen(true);
    setMidiasLoading(true);
    try {
      const [midiasRes, availRes] = await Promise.all([
        api.get<CampanhaMidia[]>(`/campanhas/${campanha.id}/midias`),
        api.get<PaginatedResponse<Midia>>('/midias', { params: { limit: 200 } }),
      ]);
      setCampanhaMidias(midiasRes.data);
      setAvailableMidias(availRes.data.data);
    } catch {
      setCampanhaMidias([]);
      setAvailableMidias([]);
    } finally {
      setMidiasLoading(false);
    }
  };

  const fetchCampanhaMidias = async (campanhaId: string) => {
    setMidiasLoading(true);
    try {
      const { data } = await api.get<CampanhaMidia[]>(`/campanhas/${campanhaId}/midias`);
      setCampanhaMidias(data);
    } catch {
      setCampanhaMidias([]);
    } finally {
      setMidiasLoading(false);
    }
  };

  const fetchAvailableMidias = async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Midia>>('/midias', { params: { limit: 200 } });
      setAvailableMidias(data.data);
    } catch {
      setAvailableMidias([]);
    }
  };

  const handleAddMidia = async () => {
    if (!selectedAddMidiaId || !midiaCampanhaId) {
      toast.error('Selecione uma mídia');
      return;
    }
    setAddMidiaLoading(true);
    try {
      await api.post(`/campanhas/${midiaCampanhaId}/midias`, {
        midiaId: selectedAddMidiaId,
        ordem: addMidiaOrdem,
        duracao: addMidiaDuracao ? Number(addMidiaDuracao) : undefined,
      });
      toast.success('Mídia adicionada!');
      setSelectedAddMidiaId('');
      setAddMidiaOrdem(0);
      setAddMidiaDuracao('');
      fetchCampanhaMidias(midiaCampanhaId);
      fetchAvailableMidias();
    } catch {
      toast.error('Erro ao adicionar mídia');
    } finally {
      setAddMidiaLoading(false);
    }
  };

  const handleRemoveMidia = async (cmId: string) => {
    if (!cmId || !midiaCampanhaId) return;
    try {
      await api.delete(`/campanhas/${midiaCampanhaId}/midias/${cmId}`);
      toast.success('Mídia removida!');
      fetchCampanhaMidias(midiaCampanhaId!);
      fetchAvailableMidias();
    } catch {
      toast.error('Erro ao remover mídia');
    }
  };

  const handleStatusChange = async (campanha: Campanha, newStatus: string) => {
    setStatusLoading(campanha.id);
    try {
      await api.patch(`/campanhas/${campanha.id}`, { status: newStatus });
      toast.success('Status atualizado!');
      fetchData();
    } catch {
      toast.error('Erro ao atualizar status');
    } finally {
      setStatusLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/campanhas/${deleteTarget.id}`);
      setDeleteTarget(null);
      toast.success('Campanha excluída!');
      fetchData();
    } catch {
      toast.error('Erro ao excluir campanha');
    } finally {
      setDeleteLoading(false);
    }
  };

  const notAssociatedMidias = availableMidias.filter(
    (m) => !campanhaMidias.some((cm) => cm.midiaId === m.id),
  );

  const renderStatusActions = (campanha: Campanha) => {
    const status = campanha.status;
    const actions: { label: string; icon: React.ReactNode; target: string; variant?: 'default' | 'outline' | 'destructive' | 'secondary' }[] = [];

    if (status === 'draft' || status === 'paused') {
      actions.push({ label: 'Ativar', icon: <Play className="h-3.5 w-3.5" />, target: 'active', variant: 'default' });
    }
    if (status === 'active') {
      actions.push({ label: 'Pausar', icon: <Pause className="h-3.5 w-3.5" />, target: 'paused', variant: 'outline' });
    }
    if (status === 'active' || status === 'paused') {
      actions.push({ label: 'Concluir', icon: <CheckCircle2 className="h-3.5 w-3.5" />, target: 'completed', variant: 'secondary' });
    }
    if (status === 'draft' || status === 'active' || status === 'paused') {
      actions.push({ label: 'Cancelar', icon: <XCircle className="h-3.5 w-3.5" />, target: 'canceled', variant: 'destructive' });
    }

    if (actions.length === 0) return null;

    return (
      <div className="flex gap-1 flex-wrap">
        {actions.map((action) => (
          <Button
            key={action.target}
            variant={action.variant ?? 'outline'}
            size="sm"
            className="h-7 text-xs gap-1"
            disabled={statusLoading === campanha.id}
            onClick={() => handleStatusChange(campanha, action.target)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Campanhas</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Campanhas</CardTitle>
          <div className="flex gap-4 mt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar campanhas..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter || '_all'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          ) : campanhas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhuma campanha encontrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Fim</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Estabelecimento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanhas.map((campanha) => (
                  <TableRow key={campanha.id}>
                    <TableCell className="font-medium">{campanha.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tipoLabelMap[campanha.tipo] ?? campanha.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusConfig[campanha.status]?.className}
                      >
                        {statusConfig[campanha.status]?.label ?? campanha.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {campanha.dataInicio ? formatDate(campanha.dataInicio) : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {campanha.dataFim ? formatDate(campanha.dataFim) : '-'}
                    </TableCell>
                    <TableCell>{campanha.prioridade}</TableCell>
                    <TableCell>
                      {campanha.estabelecimentoId
                        ? (estabelecimentoMap.get(campanha.estabelecimentoId)?.nome ?? '-')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderStatusActions(campanha)}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7"
                            onClick={() => openMidiaManagement(campanha)}
                            title="Gerenciar Mídias"
                          >
                            <Film className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7"
                            onClick={() => openEdit(campanha)}
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 w-7"
                            onClick={() => setDeleteTarget(campanha)}
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages} ({meta.total} registros)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrevious}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
            <DialogDescription>
              Preencha os dados da campanha abaixo.
            </DialogDescription>
          </DialogHeader>
          <CampanhaForm
            key={editing?.id ?? 'new'}
            defaultValues={
              editing
                ? {
                    nome: editing.nome,
                    descricao: editing.descricao ?? '',
                    tipo: editing.tipo,
                    dataInicio: editing.dataInicio ? editing.dataInicio.split('T')[0] : '',
                    dataFim: editing.dataFim ? editing.dataFim.split('T')[0] : '',
                    prioridade: editing.prioridade,
                    estabelecimentoId: editing.estabelecimentoId ?? '',
                  }
                : undefined
            }
            estabelecimentos={estabelecimentos}
            onSubmit={handleSubmit}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={midiaDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMidiaDialogOpen(false);
            setMidiaCampanhaId(null);
            setCampanhaMidias([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Mídias</DialogTitle>
            <DialogDescription>
              {midiaCampanhaNome ? `Adicione ou remova mídias da campanha "${midiaCampanhaNome}"` : 'Gerencie as mídias da campanha'}
            </DialogDescription>
          </DialogHeader>
          {midiasLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Mídias associadas ({campanhaMidias.length})</h4>
                {campanhaMidias.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    Nenhuma mídia associada a esta campanha.
                  </p>
                ) : (
                  <div className="border rounded-md divide-y">
                    {campanhaMidias
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((cm) => (
                        <div key={cm.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{cm.midia.nome}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>Ordem: {cm.ordem}</span>
                              {cm.duracao != null && <span>Duração: {cm.duracao}s</span>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-destructive shrink-0"
                            onClick={() => handleRemoveMidia(cm.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Adicionar mídia</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="addMidia">Mídia</Label>
                    <Select value={selectedAddMidiaId} onValueChange={setSelectedAddMidiaId}>
                      <SelectTrigger id="addMidia">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {notAssociatedMidias.length === 0 ? (
                          <SelectItem value="_none_" disabled>
                            Nenhuma mídia disponível
                          </SelectItem>
                        ) : (
                          notAssociatedMidias.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="addOrdem">Ordem</Label>
                    <Input
                      id="addOrdem"
                      type="number"
                      min={0}
                      value={addMidiaOrdem}
                      onChange={(e) => setAddMidiaOrdem(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="addDuracao">Duração (s)</Label>
                    <Input
                      id="addDuracao"
                      type="number"
                      min={0}
                      placeholder="Opcional"
                      value={addMidiaDuracao}
                      onChange={(e) => setAddMidiaDuracao(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={handleAddMidia}
                  disabled={addMidiaLoading || !selectedAddMidiaId}
                >
                  {addMidiaLoading ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a campanha <strong>{deleteTarget?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
