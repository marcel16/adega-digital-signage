'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  Image,
  Video,
  Music,
  Globe,
  FileQuestion,
  Eye,
  X,
  HardDrive,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { formatBytes, formatDate } from '@/lib/utils';
import type { Midia, PaginatedResponse, DashboardStats } from '@/types';

const tipoConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  image: { label: 'Imagem', icon: Image, className: 'bg-blue-100 text-blue-800 border-blue-200' },
  video: { label: 'Vídeo', icon: Video, className: 'bg-purple-100 text-purple-800 border-purple-200' },
  audio: { label: 'Áudio', icon: Music, className: 'bg-amber-100 text-amber-800 border-amber-200' },
  url: { label: 'URL', icon: Globe, className: 'bg-green-100 text-green-800 border-green-200' },
  html: { label: 'HTML', icon: FileQuestion, className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  processing: { label: 'Processando', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ready: { label: 'Pronto', className: 'bg-green-100 text-green-800 border-green-200' },
  error: { label: 'Erro', className: 'bg-red-100 text-red-800 border-red-200' },
};

export default function MidiasPage() {
  const [midias, setMidias] = useState<Midia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<Midia>['meta'] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Midia | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Midia | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNome, setUploadNome] = useState('');
  const [uploadDescricao, setUploadDescricao] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadPasta, setUploadPasta] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (search) params.search = search;
      if (tipoFilter) params.tipo = tipoFilter;
      const { data } = await api.get<PaginatedResponse<Midia>>('/midias', { params });
      setMidias(data.data);
      setMeta(data.meta);
    } catch {
      setMidias([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tipoFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get<DashboardStats>('/dashboard/stats');
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

  const handleFileSelect = (file: File | null) => {
    setUploadFile(file);
    if (file) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadNome(nameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Selecione um arquivo para upload');
      return;
    }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('nome', uploadNome || uploadFile.name.replace(/\.[^/.]+$/, ''));
      if (uploadDescricao) formData.append('descricao', uploadDescricao);
      if (uploadTags) formData.append('tags', uploadTags);
      if (uploadPasta) formData.append('pasta', uploadPasta);

      await api.post('/midias', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Mídia enviada com sucesso!');
      setUploadDialogOpen(false);
      resetUploadForm();
      fetchData();
      fetchStats();
    } catch {
      toast.error('Erro ao enviar mídia');
    } finally {
      setUploadLoading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadNome('');
    setUploadDescricao('');
    setUploadTags('');
    setUploadPasta('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/midias/${deleteTarget.id}`);
      setDeleteTarget(null);
      toast.success('Mídia excluída com sucesso!');
      fetchData();
      fetchStats();
    } catch {
      toast.error('Erro ao excluir mídia');
    } finally {
      setDeleteLoading(false);
    }
  };

  const storagePercent = stats ? Math.min(stats.storageUsagePercent, 100) : 0;
  const storageColor = storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-yellow-500' : 'bg-primary';

  return (
    <div className="space-y-6">
      {stats && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Armazenamento utilizado</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(stats.storageUsed)} / {formatBytes(stats.storageLimit)}
                  </p>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${storageColor}`}
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mídias</h1>
        <Button onClick={() => { resetUploadForm(); setUploadDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Mídia
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar mídias..."
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
            <SelectItem value="image">Imagens</SelectItem>
            <SelectItem value="video">Vídeos</SelectItem>
            <SelectItem value="audio">Áudios</SelectItem>
            <SelectItem value="url">URLs</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando...</span>
        </div>
      ) : midias.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          Nenhuma mídia encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {midias.map((midia) => {
            const TipoIcon = tipoConfig[midia.tipo]?.icon ?? FileQuestion;
            const status = statusConfig[midia.status];
            return (
              <Card
                key={midia.id}
                className="group cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDetailTarget(midia)}
              >
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden rounded-t-lg">
                    {midia.tipo === 'image' && midia.thumbnailUrl ? (
                      <img
                        src={midia.thumbnailUrl}
                        alt={midia.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <TipoIcon className="h-10 w-10 mb-1" />
                        <span className="text-xs">{tipoConfig[midia.tipo]?.label ?? midia.tipo}</span>
                      </div>
                    )}
                    <Badge
                      variant="outline"
                      className={`absolute top-2 right-2 ${status?.className ?? ''}`}
                    >
                      {status?.label ?? midia.status}
                    </Badge>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="font-medium text-sm truncate" title={midia.nome}>
                      {midia.nome}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={tipoConfig[midia.tipo]?.className}>
                        <TipoIcon className="h-3 w-3 mr-1" />
                        {tipoConfig[midia.tipo]?.label ?? midia.tipo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatBytes(midia.tamanho)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">{formatDate(midia.createdAt)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailTarget(midia)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(midia)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Mídia</DialogTitle>
            <DialogDescription>
              Selecione um arquivo para fazer upload.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.html,.htm"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
              {uploadFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    {uploadFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(uploadFile)}
                        alt="preview"
                        className="h-20 w-20 object-cover rounded"
                      />
                    ) : (
                      <Upload className="h-10 w-10 text-primary" />
                    )}
                  </div>
                  <p className="text-sm font-medium">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(uploadFile.size)}</p>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}>
                    <X className="h-4 w-4 mr-1" /> Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arraste um arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">Imagens, vídeos, áudios ou HTML</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="uploadNome">Nome</Label>
                <Input id="uploadNome" value={uploadNome} onChange={(e) => setUploadNome(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="uploadDescricao">Descrição</Label>
                <textarea
                  id="uploadDescricao"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={uploadDescricao}
                  onChange={(e) => setUploadDescricao(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="uploadTags">Tags (separadas por vírgula)</Label>
                <Input id="uploadTags" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="tag1, tag2, tag3" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="uploadPasta">Pasta</Label>
                <Input id="uploadPasta" value={uploadPasta} onChange={(e) => setUploadPasta(e.target.value)} placeholder="Ex: Promoções, Logos..." />
              </div>
            </div>

            <Button className="w-full" onClick={handleUpload} disabled={uploadLoading || !uploadFile}>
              {uploadLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailTarget} onOpenChange={(open) => { if (!open) setDetailTarget(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailTarget?.nome}</DialogTitle>
            <DialogDescription>Detalhes da mídia</DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {detailTarget.tipo === 'image' && detailTarget.url ? (
                  <img src={detailTarget.url} alt={detailTarget.nome} className="w-full h-full object-cover" />
                ) : detailTarget.tipo === 'video' ? (
                  <video src={detailTarget.url} controls className="w-full h-full object-cover" />
                ) : detailTarget.tipo === 'audio' ? (
                  <div className="flex flex-col items-center gap-3 p-8">
                    <Music className="h-16 w-16 text-muted-foreground" />
                    <audio src={detailTarget.url} controls className="w-full" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-8">
                    <Globe className="h-16 w-16 text-muted-foreground" />
                    <a href={detailTarget.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                      {detailTarget.url}
                    </a>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <Badge variant="outline" className={tipoConfig[detailTarget.tipo]?.className}>
                    {tipoConfig[detailTarget.tipo]?.label ?? detailTarget.tipo}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusConfig[detailTarget.status]?.className}>
                    {statusConfig[detailTarget.status]?.label ?? detailTarget.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Tamanho</p>
                  <p className="font-medium">{formatBytes(detailTarget.tamanho)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MIME Type</p>
                  <p className="font-medium">{detailTarget.mimeType}</p>
                </div>
                {detailTarget.duracao && (
                  <div>
                    <p className="text-muted-foreground">Duração</p>
                    <p className="font-medium">{detailTarget.duracao}s</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">{formatDate(detailTarget.createdAt)}</p>
                </div>
                {detailTarget.tags && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Tags</p>
                    <p className="font-medium">{detailTarget.tags}</p>
                  </div>
                )}
                {detailTarget.pasta && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Pasta</p>
                    <p className="font-medium">{detailTarget.pasta}</p>
                  </div>
                )}
                {detailTarget.descricao && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Descrição</p>
                    <p className="font-medium">{detailTarget.descricao}</p>
                  </div>
                )}
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
              Tem certeza que deseja excluir a mídia <strong>{deleteTarget?.nome}</strong>?
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
