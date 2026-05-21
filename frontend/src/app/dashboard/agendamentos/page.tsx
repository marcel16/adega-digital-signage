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
  CheckCircle2,
  XCircle,
  Tv,
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
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Agendamento, Tv as TvType, Campanha, Playlist, PaginatedResponse } from '@/types';
import { AgendamentoForm, type AgendamentoFormValues } from '@/components/forms/agendamento-form';

const DIAS_LABEL: Record<string, string> = {
  dom: 'Dom',
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-green-100 text-green-800 border-green-200' },
  paused: { label: 'Pausado', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  completed: { label: 'Concluído', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  canceled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' },
};

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [tvs, setTvs] = useState<TvType[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tvFilter, setTvFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<Agendamento>['meta'] | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agendamento | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Agendamento | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const [selectedTvId, setSelectedTvId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<{ nome: string; campanha?: string; playlist?: string } | null>(null);
  const [nowPlayingLoading, setNowPlayingLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (tvFilter) params.tvId = tvFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<PaginatedResponse<Agendamento>>('/agendamentos', { params });
      setAgendamentos(data.data);
      setMeta(data.meta);
    } catch {
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tvFilter, statusFilter]);

  const fetchTvs = useCallback(async () => {
    try {
      const { data } = await api.get<PaginatedResponse<TvType>>('/tvs', { params: { limit: 200 } });
      setTvs(data.data);
    } catch {
      setTvs([]);
    }
  }, []);

  const fetchCampanhas = useCallback(async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Campanha>>('/campanhas', { params: { limit: 200 } });
      setCampanhas(data.data);
    } catch {
      setCampanhas([]);
    }
  }, []);

  const fetchPlaylists = useCallback(async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Playlist>>('/playlists', { params: { limit: 200 } });
      setPlaylists(data.data);
    } catch {
      setPlaylists([]);
    }
  }, []);

  const fetchNowPlaying = useCallback(async (tvId: string) => {
    setNowPlayingLoading(true);
    try {
      const { data } = await api.get<{ nome: string; campanha?: string; playlist?: string }>(
        `/agendamentos/now-playing/${tvId}`,
      );
      setNowPlaying(data);
    } catch {
      setNowPlaying(null);
    } finally {
      setNowPlayingLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTvs(), fetchCampanhas(), fetchPlaylists()]);
  }, [fetchTvs, fetchCampanhas, fetchPlaylists]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedTvId) {
      fetchNowPlaying(selectedTvId);
    } else {
      setNowPlaying(null);
    }
  }, [selectedTvId, fetchNowPlaying]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTvFilter = (value: string) => {
    setTvFilter(value === '_all' ? '' : value);
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

  const openEdit = (agendamento: Agendamento) => {
    setEditing(agendamento);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: AgendamentoFormValues) => {
    setFormLoading(true);
    try {
      if (editing) {
        await api.put(`/agendamentos/${editing.id}`, values);
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        await api.post('/agendamentos', values);
        toast.success('Agendamento criado com sucesso!');
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error(editing ? 'Erro ao atualizar agendamento' : 'Erro ao criar agendamento');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (agendamento: Agendamento, newStatus: string) => {
    setStatusLoading(agendamento.id);
    try {
      await api.patch(`/agendamentos/${agendamento.id}`, { status: newStatus });
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
      await api.delete(`/agendamentos/${deleteTarget.id}`);
      setDeleteTarget(null);
      toast.success('Agendamento excluído!');
      fetchData();
    } catch {
      toast.error('Erro ao excluir agendamento');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderStatusActions = (agendamento: Agendamento) => {
    const s = agendamento.status;
    const actions: { label: string; icon: React.ReactNode; target: string; variant?: 'default' | 'outline' | 'destructive' | 'secondary' }[] = [];

    if (s === 'paused') {
      actions.push({ label: 'Ativar', icon: <Play className="h-3.5 w-3.5" />, target: 'active', variant: 'default' });
    }
    if (s === 'active') {
      actions.push({ label: 'Completar', icon: <CheckCircle2 className="h-3.5 w-3.5" />, target: 'completed', variant: 'secondary' });
      actions.push({ label: 'Cancelar', icon: <XCircle className="h-3.5 w-3.5" />, target: 'canceled', variant: 'destructive' });
    }
    if (s === 'paused') {
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
            disabled={statusLoading === agendamento.id}
            onClick={() => handleStatusChange(agendamento, action.target)}
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
        <h1 className="text-2xl font-bold tracking-tight">Agendamentos</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Lista de Agendamentos</CardTitle>
              <div className="flex gap-4 mt-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar agendamentos..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={tvFilter || '_all'} onValueChange={handleTvFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por TV" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todas as TVs</SelectItem>
                    {tvs.map((tv) => (
                      <SelectItem key={tv.id} value={tv.id}>
                        {tv.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter || '_all'} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
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
              ) : agendamentos.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhum agendamento encontrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>TV</TableHead>
                      <TableHead>Dias da Semana</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Data Início/Fim</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recorrente</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agendamentos.map((ag) => (
                      <TableRow key={ag.id}>
                        <TableCell className="font-medium">{ag.nome}</TableCell>
                        <TableCell>{ag.tv?.nome ?? '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {ag.diasSemana.map((dia) => (
                              <Badge key={dia} variant="outline" className="text-xs">
                                {DIAS_LABEL[dia] ?? dia}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {ag.horarioInicio}
                          {ag.horarioFim ? ` - ${ag.horarioFim}` : ''}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(ag.dataInicio)}
                          {ag.dataFim ? ` - ${formatDate(ag.dataFim)}` : ''}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusConfig[ag.status]?.className}
                          >
                            {statusConfig[ag.status]?.label ?? ag.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ag.recorrente ? 'Sim' : 'Não'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            {renderStatusActions(ag)}
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7"
                                onClick={() => openEdit(ag)}
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 w-7"
                                onClick={() => setDeleteTarget(ag)}
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
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tv className="h-5 w-5" />
                O que está tocando agora?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Select
                  value={selectedTvId ?? '_none'}
                  onValueChange={(value) => setSelectedTvId(value === '_none' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma TV" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhuma</SelectItem>
                    {tvs.map((tv) => (
                      <SelectItem key={tv.id} value={tv.id}>
                        {tv.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Separator />

                {!selectedTvId ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Selecione uma TV para ver o que está tocando.
                  </p>
                ) : nowPlayingLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : nowPlaying ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Conteúdo atual</p>
                      <p className="font-medium">{nowPlaying.nome}</p>
                    </div>
                    {nowPlaying.campanha && (
                      <div>
                        <p className="text-xs text-muted-foreground">Campanha</p>
                        <p className="text-sm">{nowPlaying.campanha}</p>
                      </div>
                    )}
                    {nowPlaying.playlist && (
                      <div>
                        <p className="text-xs text-muted-foreground">Playlist</p>
                        <p className="text-sm">{nowPlaying.playlist}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum conteúdo tocando no momento.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do agendamento abaixo.
            </DialogDescription>
          </DialogHeader>
          <AgendamentoForm
            key={editing?.id ?? 'new'}
            defaultValues={
              editing
                ? {
                    nome: editing.nome,
                    descricao: editing.descricao ?? '',
                    tvId: editing.tvId,
                    diasSemana: editing.diasSemana,
                    horarioInicio: editing.horarioInicio,
                    horarioFim: editing.horarioFim ?? '',
                    dataInicio: editing.dataInicio.split('T')[0],
                    dataFim: editing.dataFim ? editing.dataFim.split('T')[0] : '',
                    recorrente: editing.recorrente,
                    campanhaId: editing.campanhaId ?? '',
                    playlistId: editing.playlistId ?? '',
                  }
                : undefined
            }
            tvs={tvs}
            campanhas={campanhas}
            playlists={playlists}
            onSubmit={handleSubmit}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o agendamento <strong>{deleteTarget?.nome}</strong>?
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
