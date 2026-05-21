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
  Download,
  ArrowUp,
  ArrowDown,
  ListMusic,
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
import type { Playlist, PlaylistItem, Midia, PaginatedResponse } from '@/types';
import { PlaylistForm, type PlaylistFormValues, TIPO_OPTIONS } from '@/components/forms/playlist-form';

const tipoLabelMap: Record<string, string> = {};
for (const opt of TIPO_OPTIONS) {
  tipoLabelMap[opt.value] = opt.label;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<Playlist>['meta'] | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemPlaylistId, setItemPlaylistId] = useState<string | null>(null);
  const [itemPlaylistNome, setItemPlaylistNome] = useState('');
  const [playlistItens, setPlaylistItens] = useState<PlaylistItem[]>([]);
  const [availableMidias, setAvailableMidias] = useState<Midia[]>([]);
  const [itensLoading, setItensLoading] = useState(false);
  const [selectedAddMidiaId, setSelectedAddMidiaId] = useState('');
  const [addMidiaDuracao, setAddMidiaDuracao] = useState('');
  const [addMidiaLoading, setAddMidiaLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (tipoFilter) params.tipo = tipoFilter;
      const { data } = await api.get<PaginatedResponse<Playlist>>('/playlists', { params });
      setPlaylists(data.data);
      setMeta(data.meta);
    } catch {
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tipoFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTipoFilter = (value: string) => {
    setTipoFilter(value === '_all' ? '' : value);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (playlist: Playlist) => {
    setEditing(playlist);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: PlaylistFormValues) => {
    setFormLoading(true);
    try {
      if (editing) {
        await api.put(`/playlists/${editing.id}`, values);
        toast.success('Playlist atualizada com sucesso!');
        setDialogOpen(false);
        fetchData();
      } else {
        const { data } = await api.post<Playlist>('/playlists', values);
        toast.success('Playlist criada com sucesso!');
        setDialogOpen(false);
        fetchData();
        setItemPlaylistId(data.id);
        setItemPlaylistNome(data.nome);
        openItemDialog(data.id);
      }
    } catch {
      toast.error(editing ? 'Erro ao atualizar playlist' : 'Erro ao criar playlist');
    } finally {
      setFormLoading(false);
    }
  };

  const openItemDialog = async (playlistId: string) => {
    setItemDialogOpen(true);
    await Promise.all([fetchPlaylistItens(playlistId), fetchAvailableMidias()]);
  };

  const openItemManagement = async (playlist: Playlist) => {
    setItemPlaylistId(playlist.id);
    setItemPlaylistNome(playlist.nome);
    setItemDialogOpen(true);
    setItensLoading(true);
    try {
      const [itensRes, availRes] = await Promise.all([
        api.get<PlaylistItem[]>(`/playlists/${playlist.id}/itens`),
        api.get<PaginatedResponse<Midia>>('/midias', { params: { limit: 200 } }),
      ]);
      setPlaylistItens(itensRes.data);
      setAvailableMidias(availRes.data.data);
    } catch {
      setPlaylistItens([]);
      setAvailableMidias([]);
    } finally {
      setItensLoading(false);
    }
  };

  const fetchPlaylistItens = async (playlistId: string) => {
    setItensLoading(true);
    try {
      const { data } = await api.get<PlaylistItem[]>(`/playlists/${playlistId}/itens`);
      setPlaylistItens(data);
    } catch {
      setPlaylistItens([]);
    } finally {
      setItensLoading(false);
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
    if (!selectedAddMidiaId || !itemPlaylistId) {
      toast.error('Selecione uma mídia');
      return;
    }
    setAddMidiaLoading(true);
    try {
      const nextOrdem = playlistItens.length > 0 ? Math.max(...playlistItens.map((i) => i.ordem)) + 1 : 0;
      await api.post(`/playlists/${itemPlaylistId}/itens`, {
        midiaId: selectedAddMidiaId,
        ordem: nextOrdem,
        duracao: addMidiaDuracao ? Number(addMidiaDuracao) : undefined,
      });
      toast.success('Mídia adicionada!');
      setSelectedAddMidiaId('');
      setAddMidiaDuracao('');
      fetchPlaylistItens(itemPlaylistId);
      fetchAvailableMidias();
    } catch {
      toast.error('Erro ao adicionar mídia');
    } finally {
      setAddMidiaLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!itemId || !itemPlaylistId) return;
    try {
      await api.delete(`/playlists/${itemPlaylistId}/itens/${itemId}`);
      toast.success('Item removido!');
      fetchPlaylistItens(itemPlaylistId!);
      fetchAvailableMidias();
    } catch {
      toast.error('Erro ao remover item');
    }
  };

  const handleReorder = async (itemId: string, direction: 'up' | 'down') => {
    const sorted = [...playlistItens].sort((a, b) => a.ordem - b.ordem);
    const idx = sorted.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const current = sorted[idx];
    const target = sorted[swapIdx];
    try {
      await Promise.all([
        api.patch(`/playlists/${itemPlaylistId}/itens/${current.id}`, { ordem: target.ordem }),
        api.patch(`/playlists/${itemPlaylistId}/itens/${target.id}`, { ordem: current.ordem }),
      ]);
      fetchPlaylistItens(itemPlaylistId!);
    } catch {
      toast.error('Erro ao reordenar');
    }
  };

  const handleDownloadM3U = async (playlist: Playlist) => {
    try {
      const { data: itens } = await api.get<PlaylistItem[]>(`/playlists/${playlist.id}/itens`);
      const sorted = [...itens].sort((a, b) => a.ordem - b.ordem);
      const lines = ['#EXTM3U'];
      for (const item of sorted) {
        const dur = item.duracao ?? -1;
        lines.push(`#EXTINF:${dur},${item.midia.nome}`);
        lines.push(item.midia.url);
      }
      const content = lines.join('\n');
      const blob = new Blob([content], { type: 'audio/x-mpegurl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${playlist.nome.replace(/\s+/g, '_')}.m3u`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao gerar M3U');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/playlists/${deleteTarget.id}`);
      setDeleteTarget(null);
      toast.success('Playlist excluída!');
      fetchData();
    } catch {
      toast.error('Erro ao excluir playlist');
    } finally {
      setDeleteLoading(false);
    }
  };

  const notAssociatedMidias = availableMidias.filter(
    (m) => !playlistItens.some((item) => item.midiaId === m.id),
  );

  const sortedItens = [...playlistItens].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Playlists</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Playlist
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Playlists</CardTitle>
          <div className="flex gap-4 mt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar playlists..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFilter || '_all'} onValueChange={handleTipoFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos os tipos</SelectItem>
                {TIPO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
          ) : playlists.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhuma playlist encontrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qtd Itens</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playlists.map((playlist) => (
                  <TableRow key={playlist.id}>
                    <TableCell className="font-medium">{playlist.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {playlist.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tipoLabelMap[playlist.tipo] ?? playlist.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{Array.isArray(playlist.itens) ? playlist.itens.length : 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(playlist.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7"
                          onClick={() => openItemManagement(playlist)}
                          title="Gerenciar Itens"
                        >
                          <ListMusic className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7"
                          onClick={() => openEdit(playlist)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7"
                          onClick={() => handleDownloadM3U(playlist)}
                          title="Download M3U"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 w-7"
                          onClick={() => setDeleteTarget(playlist)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Playlist' : 'Nova Playlist'}</DialogTitle>
            <DialogDescription>
              Preencha os dados da playlist abaixo.
            </DialogDescription>
          </DialogHeader>
          <PlaylistForm
            key={editing?.id ?? 'new'}
            defaultValues={
              editing
                ? {
                    nome: editing.nome,
                    descricao: editing.descricao ?? '',
                    tipo: editing.tipo,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={itemDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setItemDialogOpen(false);
            setItemPlaylistId(null);
            setPlaylistItens([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Itens</DialogTitle>
            <DialogDescription>
              {itemPlaylistNome ? `Adicione ou remova mídias da playlist "${itemPlaylistNome}"` : 'Gerencie os itens da playlist'}
            </DialogDescription>
          </DialogHeader>
          {itensLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Itens ({playlistItens.length})</h4>
                {playlistItens.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    Nenhuma mídia associada a esta playlist.
                  </p>
                ) : (
                  <div className="border rounded-md divide-y">
                    {sortedItens.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            disabled={index === 0}
                            onClick={() => handleReorder(item.id, 'up')}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            disabled={index === sortedItens.length - 1}
                            onClick={() => handleReorder(item.id, 'down')}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.midia.nome}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>Ordem: {item.ordem}</span>
                            {item.duracao != null && <span>Duração: {item.duracao}s</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 text-destructive shrink-0"
                          onClick={() => handleRemoveItem(item.id)}
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
                <div className="grid grid-cols-2 gap-3">
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
              Tem certeza que deseja excluir a playlist <strong>{deleteTarget?.nome}</strong>?
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
