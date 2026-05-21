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
  Copy,
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
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Tv, Estabelecimento, PaginatedResponse } from '@/types';
import { TvForm, type TvFormValues } from '@/components/forms/tv-form';

const statusConfig: Record<string, { label: string; className: string }> = {
  online: { label: 'Online', className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80' },
  offline: { label: 'Offline', className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100/80' },
  paused: { label: 'Pausado', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80' },
  error: { label: 'Erro', className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80' },
};

export default function TVsPage() {
  const [tvs, setTvs] = useState<Tv[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estabelecimentoFilter, setEstabelecimentoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<Tv>['meta'] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tv | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tv | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (estabelecimentoFilter) params.estabelecimentoId = estabelecimentoFilter;
      const { data } = await api.get<PaginatedResponse<Tv>>('/tvs', { params });
      setTvs(data.data);
      setMeta(data.meta);
    } catch {
      setTvs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, estabelecimentoFilter]);

  const fetchEstabelecimentos = useCallback(async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Estabelecimento>>('/estabelecimentos', {
        params: { limit: 100 },
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

  const handleFilterChange = (value: string) => {
    setEstabelecimentoFilter(value === '_all' ? '' : value);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (tv: Tv) => {
    setEditing(tv);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: TvFormValues) => {
    setFormLoading(true);
    try {
      if (editing) {
        await api.put(`/tvs/${editing.id}`, values);
      } else {
        await api.post('/tvs', values);
      }
      setDialogOpen(false);
      fetchData();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/tvs/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyIdentificador = async (identificador: string) => {
    try {
      await navigator.clipboard.writeText(identificador);
      toast.success('Identificador copiado!');
    } catch {
      toast.error('Erro ao copiar identificador');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">TVs</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova TV
          </Button>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar TV' : 'Nova TV'}</DialogTitle>
              <DialogDescription>
                Preencha os dados da TV abaixo.
              </DialogDescription>
            </DialogHeader>
            <TvForm
              key={editing?.id ?? 'new'}
              defaultValues={
                editing
                  ? {
                      nome: editing.nome,
                      descricao: editing.descricao ?? '',
                      modelo: editing.modelo ?? '',
                      resolucao: editing.resolucao ?? '',
                      estabelecimentoId: editing.estabelecimentoId,
                      volume: editing.volume,
                      rotacaoAutomatica: editing.rotacaoAutomatica,
                      intervaloRotacao: editing.intervaloRotacao,
                    }
                  : undefined
              }
              estabelecimentos={estabelecimentos}
              onSubmit={handleSubmit}
              loading={formLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de TVs</CardTitle>
          <div className="flex gap-4 mt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, identificador..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={estabelecimentoFilter || '_all'}
              onValueChange={handleFilterChange}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filtrar por estabelecimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos os estabelecimentos</SelectItem>
                {estabelecimentos.map((est) => (
                  <SelectItem key={est.id} value={est.id}>
                    {est.nome}
                  </SelectItem>
                ))}
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
          ) : tvs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhuma TV encontrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Estabelecimento</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Ping</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tvs.map((tv) => (
                  <TableRow key={tv.id}>
                    <TableCell className="font-medium">{tv.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {tv.identificador}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyIdentificador(tv.identificador)}
                          title="Copiar identificador"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{tv.estabelecimento?.nome ?? '-'}</TableCell>
                    <TableCell>{tv.modelo ?? '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusConfig[tv.status]?.className}
                      >
                        {statusConfig[tv.status]?.label ?? tv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {tv.lastPingAt ? formatDate(tv.lastPingAt) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(tv)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(tv)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a TV <strong>{deleteTarget?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
