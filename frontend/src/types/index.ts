export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'super_admin' | 'admin' | 'gerente' | 'operador' | 'visualizador';
  tenantId: string;
  avatarUrl?: string;
  telefone?: string;
  ativo: boolean;
  ultimoLogin?: string;
  tenant?: { id: string; nome: string; slug: string; status: string };
}

export interface Tenant {
  id: string;
  nome: string;
  slug: string;
  documento?: string;
  email?: string;
  status: string;
  maxEstabelecimentos: number;
  maxTvs: number;
  maxMidias: number;
  maxArmazenamentoMb: number;
  createdAt: string;
}

export interface Estabelecimento {
  id: string;
  nome: string;
  slug: string;
  documento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  ativo: boolean;
  tenantId: string;
  createdAt: string;
}

export interface Tv {
  id: string;
  nome: string;
  identificador: string;
  descricao?: string;
  modelo?: string;
  resolucao?: string;
  status: 'online' | 'offline' | 'paused' | 'error';
  ipAddress?: string;
  lastPingAt?: string;
  volume: number;
  rotacaoAutomatica: boolean;
  intervaloRotacao: number;
  estabelecimentoId: string;
  estabelecimento?: Estabelecimento;
  tenantId: string;
  createdAt: string;
}

export interface Midia {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'image' | 'video' | 'audio' | 'url' | 'html';
  mimeType: string;
  tamanho: number;
  duracao?: number;
  largura?: number;
  altura?: number;
  url: string;
  thumbnailUrl?: string;
  status: 'processing' | 'ready' | 'error';
  tags?: string;
  pasta?: string;
  tenantId: string;
  createdAt: string;
}

export interface Campanha {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'canceled';
  dataInicio?: string;
  dataFim?: string;
  prioridade: number;
  estabelecimentoId?: string;
  midias: CampanhaMidia[];
  tenantId: string;
  criadoPorId: string;
  createdAt: string;
}

export interface CampanhaMidia {
  id: string;
  campanhaId: string;
  midiaId: string;
  ordem: number;
  duracao?: number;
  midia: Midia;
}

export interface Agendamento {
  id: string;
  nome: string;
  descricao?: string;
  diasSemana: string[];
  horarioInicio: string;
  horarioFim?: string;
  dataInicio: string;
  dataFim?: string;
  status: string;
  recorrente: boolean;
  tvId: string;
  campanhaId?: string;
  playlistId?: string;
  tv?: Tv;
  campanha?: Campanha;
  tenantId: string;
  createdAt: string;
}

export interface Playlist {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  itens: PlaylistItem[];
  tenantId: string;
  createdAt: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  midiaId: string;
  ordem: number;
  duracao?: number;
  tvId?: string;
  midia: Midia;
  createdAt: string;
}

export interface Plano {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  valor: number;
  ciclo: string;
  maxEstabelecimentos: number;
  maxTvs: number;
  maxMidias: number;
  maxArmazenamentoMb: number;
  recursos?: string;
  status: string;
  ordem: number;
  destaque: boolean;
}

export interface Assinatura {
  id: string;
  tenantId: string;
  asaasId?: string;
  planoTipo: string;
  status: string;
  dataInicio: string;
  dataFim?: string;
  valor: number;
  ciclo: string;
  faturas: Fatura[];
}

export interface Fatura {
  id: string;
  assinaturaId: string;
  valor: number;
  status: string;
  dataVencimento: string;
  dataPagamento?: string;
  urlBoleto?: string;
  urlPix?: string;
}

export interface DashboardStats {
  totalEstabelecimentos: number;
  totalTvs: number;
  tvsOnline: number;
  tvsOffline: number;
  totalMidias: number;
  totalMidiasByTipo: { image: number; video: number; audio: number; url: number };
  totalCampanhas: { total: number; active: number; draft: number; completed: number };
  storageUsed: number;
  storageLimit: number;
  storageUsagePercent: number;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  tenantId: string;
  metadata: any;
  ip?: string;
  createdAt: string;
  user?: { nome: string; email: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}