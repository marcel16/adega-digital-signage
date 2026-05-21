'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Monitor,
  Copy,
  Check,
  Loader2,
  Signal,
  SignalHigh,
  SignalLow,
  Wifi,
  Tv as TvIcon,
  Smartphone,
  Radio,
  MonitorSmartphone,
  Info,
  Play,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Tv, PaginatedResponse } from '@/types';

const statusConfig: Record<string, { label: string; className: string; icon: typeof Signal }> = {
  online: { label: 'Online', className: 'bg-green-100 text-green-800 border-green-200', icon: SignalHigh },
  offline: { label: 'Offline', className: 'bg-gray-100 text-gray-800 border-gray-200', icon: SignalLow },
  paused: { label: 'Pausado', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Wifi },
  error: { label: 'Erro', className: 'bg-red-100 text-red-800 border-red-200', icon: Signal },
};

interface NowPlaying {
  midiaNome: string;
  midiaTipo: string;
  campanhaNome?: string;
  playlistNome?: string;
  startedAt: string;
  duration: number;
  elapsed: number;
}

export default function IPTVPage() {
  const [tvs, setTvs] = useState<Tv[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTvId, setSelectedTvId] = useState<string>('');
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [nowPlayingLoading, setNowPlayingLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const selectedTv = tvs.find((tv) => tv.id === selectedTvId) ?? null;

  const apiOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchTvs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<Tv>>('/tvs', {
        params: { limit: 100 },
      });
      setTvs(data.data);
    } catch {
      setTvs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTvs();
  }, [fetchTvs]);

  const fetchNowPlaying = useCallback(async (identificador: string) => {
    setNowPlayingLoading(true);
    setNowPlaying(null);
    try {
      const { data } = await api.get<NowPlaying>(`/iptv/tv/${identificador}/now-playing`);
      setNowPlaying(data);
    } catch {
      setNowPlaying(null);
    } finally {
      setNowPlayingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTv?.identificador) {
      fetchNowPlaying(selectedTv.identificador);
    } else {
      setNowPlaying(null);
    }
  }, [selectedTv?.identificador, fetchNowPlaying]);

  const getM3uUrl = (identificador: string) =>
    `${apiOrigin}/api/iptv/tv/${identificador}/playlist.m3u`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      toast.success('URL copiada para a área de transferência!');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error('Erro ao copiar URL');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] ?? {
      label: status,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Signal,
    };
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IPTV - Transmissão ao Vivo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e acompanhe a transmissão ao vivo das suas TVs
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Selecionar TV</CardTitle>
          <CardDescription>Escolha uma TV para visualizar informações de transmissão IPTV</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTvId} onValueChange={setSelectedTvId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione uma TV..." />
            </SelectTrigger>
            <SelectContent>
              {tvs.map((tv) => (
                <SelectItem key={tv.id} value={tv.id}>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span>{tv.nome}</span>
                    <span className="text-xs text-muted-foreground">({tv.identificador})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando TVs...</span>
        </div>
      )}

      {!loading && selectedTv && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Informações da TV</CardTitle>
                <StatusBadge status={selectedTv.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{selectedTv.nome}</span>
                <span className="text-muted-foreground">Identificador</span>
                <span className="font-medium font-mono text-xs">{selectedTv.identificador}</span>
                <span className="text-muted-foreground">Status</span>
                <span>
                  <StatusBadge status={selectedTv.status} />
                </span>
                <span className="text-muted-foreground">IP</span>
                <span className="font-medium font-mono text-xs">
                  {selectedTv.ipAddress ?? '-'}
                </span>
                <span className="text-muted-foreground">Modelo</span>
                <span className="font-medium">{selectedTv.modelo ?? '-'}</span>
                <span className="text-muted-foreground">Resolução</span>
                <span className="font-medium">{selectedTv.resolucao ?? '-'}</span>
                <span className="text-muted-foreground">Estabelecimento</span>
                <span className="font-medium">{selectedTv.estabelecimento?.nome ?? '-'}</span>
                <span className="text-muted-foreground">Último Ping</span>
                <span className="font-medium text-xs">
                  {selectedTv.lastPingAt ? formatDate(selectedTv.lastPingAt) : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">O que está tocando agora?</CardTitle>
            </CardHeader>
            <CardContent>
              {nowPlayingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Carregando...</span>
                </div>
              ) : nowPlaying ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{nowPlaying.midiaNome}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {nowPlaying.midiaTipo}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {nowPlaying.campanhaNome && (
                      <>
                        <span className="text-muted-foreground">Campanha</span>
                        <span className="font-medium">{nowPlaying.campanhaNome}</span>
                      </>
                    )}
                    {nowPlaying.playlistNome && (
                      <>
                        <span className="text-muted-foreground">Playlist</span>
                        <span className="font-medium">{nowPlaying.playlistNome}</span>
                      </>
                    )}
                    <span className="text-muted-foreground">Iniciado em</span>
                    <span className="font-medium text-xs">{formatDate(nowPlaying.startedAt)}</span>
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">
                      {Math.floor(nowPlaying.duration / 60)}min {nowPlaying.duration % 60}s
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Radio className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma informação disponível no momento
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Verifique se a TV está online e transmitindo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">URL da Playlist M3U</CardTitle>
              <CardDescription>
                Use esta URL para acessar a transmissão ao vivo em players compatíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={getM3uUrl(selectedTv.identificador)}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyToClipboard(getM3uUrl(selectedTv.identificador))}
                  title="Copiar URL"
                >
                  {copiedUrl === getM3uUrl(selectedTv.identificador) ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  Instruções de Conexão
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <TvIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">VLC Media Player</p>
                      <p className="text-xs text-muted-foreground">
                        Abra o VLC &rarr; Mídia &rarr; Abrir Fluxo de Rede &rarr; Cole a URL acima &rarr; Reproduzir
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <Smartphone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">IPTV Apps (Mobile)</p>
                      <p className="text-xs text-muted-foreground">
                        Use apps como IPTV Smarters, TiviMate ou GSE Smart IPTV. Adicione a URL da playlist como lista M3U remota.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <MonitorSmartphone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Android TV / Google TV</p>
                      <p className="text-xs text-muted-foreground">
                        Instale o TiviMate ou IPTV Smarters pela Play Store. Configure com a URL da playlist M3U.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Acesso Web</p>
                      <p className="text-xs text-muted-foreground">
                        Acesse a URL diretamente no navegador para baixar o arquivo .m3u e importar em qualquer player compatível.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">QR Code de Acesso</CardTitle>
              <CardDescription>
                Escaneie para acessar a transmissão no celular
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="h-48 w-48 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center bg-muted/20 mb-3">
                <Radio className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium text-muted-foreground/80 text-center px-4">
                  QR Code para acesso
                </p>
                <p className="text-xs text-muted-foreground/60 text-center px-4 mt-1 break-all">
                  {getM3uUrl(selectedTv.identificador)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Aponte a câmera do celular para o QR Code acima para abrir a playlist no seu player IPTV favorito.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && !selectedTv && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Radio className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground/60">
              Selecione uma TV para começar
            </p>
            <p className="text-sm text-muted-foreground/40 mt-1">
              Escolha uma TV no seletor acima para ver as informações de transmissão IPTV
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Todas as TVs - URLs de Playlist</CardTitle>
          <CardDescription>
            Lista completa de URLs de transmissão IPTV para todas as TVs cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          ) : tvs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma TV cadastrada.
            </div>
          ) : (
            <div className="space-y-3">
              {tvs.map((tv) => (
                <div
                  key={tv.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{tv.nome}</p>
                        <StatusBadge status={tv.status} />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                        {tv.identificador}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <code className="text-xs bg-muted px-2 py-1 rounded hidden lg:block max-w-[300px] truncate">
                      {getM3uUrl(tv.identificador)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(getM3uUrl(tv.identificador))}
                      title="Copiar URL"
                    >
                      {copiedUrl === getM3uUrl(tv.identificador) ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
