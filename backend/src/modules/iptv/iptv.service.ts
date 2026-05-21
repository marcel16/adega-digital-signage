import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';

@Injectable()
export class IptvService {
  private readonly logger = new Logger(IptvService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async validateTvAccess(identificador: string, token?: string) {
    const tv = await this.prisma.tv.findFirst({
      where: { identificador, deletedAt: null },
      include: {
        estabelecimento: { select: { id: true, nome: true, tenantId: true } },
      },
    });

    if (!tv) throw new NotFoundException('TV não encontrada');

    if (token) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tv.tenantId },
      });
      if (!tenant) throw new NotFoundException('Tenant não encontrado');
    }

    await this.prisma.tv.update({
      where: { id: tv.id },
      data: { ultimoPing: new Date(), status: 'online' },
    });

    return tv;
  }

  async generateM3uForTv(tvId: string): Promise<string> {
    const tv = await this.prisma.tv.findFirst({
      where: { id: tvId, deletedAt: null },
      include: {
        estabelecimento: { select: { id: true, nome: true } },
      },
    });

    if (!tv) throw new NotFoundException('TV não encontrada');

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const now = new Date();
    const currentDay = this.getDiaSemana(now);

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        tvId,
        tenantId: tv.tenantId,
        status: { in: ['scheduled', 'playing'] },
        diasSemana: { has: currentDay },
        dataInicio: { lte: now },
        OR: [{ dataFim: null }, { dataFim: { gte: now } }],
      },
      include: {
        campanha: {
          include: {
            midias: {
              orderBy: { ordem: 'asc' },
              include: { midia: true },
            },
          },
        },
        playlist: {
          include: {
            itens: {
              orderBy: { ordem: 'asc' },
              include: { midia: true },
            },
          },
        },
      },
      orderBy: [
        { horarioInicio: 'asc' },
        { campanha: { prioridade: 'desc' } },
      ],
    });

    const lines: string[] = ['#EXTM3U'];
    lines.push(`#PLAYLIST:TV-${tv.nome}`);
    lines.push(`#EXT-X-TV-ID:${tvId}`);
    lines.push(`#EXT-X-TV-NAME:${tv.nome}`);

    let itemIndex = 0;

    for (const agendamento of agendamentos) {
      const label = agendamento.campanha
        ? `Campanha: ${agendamento.campanha.nome}`
        : agendamento.playlist
          ? `Playlist: ${agendamento.playlist.nome}`
          : agendamento.nome;

      lines.push(`#EXT-X-SCHEDULE:${agendamento.id}`);
      lines.push(`#EXT-X-SCHEDULE-TIME:${agendamento.horarioInicio}${agendamento.horarioFim ? '-' + agendamento.horarioFim : ''}`);

      if (agendamento.campanha) {
        for (const cm of agendamento.campanha.midias) {
          const duration = cm.duracao ?? cm.midia.duracao ?? 10;
          const typeTag = this.getTypeTag(cm.midia.tipo, cm.midia.mimeType);

          lines.push(`#EXTINF:${duration},${cm.midia.nome}`);
          lines.push(`#EXT-X-ORDER:${itemIndex++}`);
          lines.push(`#EXT-X-TYPE:${typeTag}`);
          lines.push(`#EXT-X-GROUP:${label}`);
          lines.push(`${baseUrl}/iptv/tv/${tv.identificador}/content/${cm.midia.id}`);
        }
      }

      if (agendamento.playlist) {
        for (const item of agendamento.playlist.itens) {
          const midia = item.midia;
          const duration = item.duracao ?? midia.duracao ?? 10;
          const typeTag = this.getTypeTag(midia.tipo, midia.mimeType);

          lines.push(`#EXTINF:${duration},${midia.nome}`);
          lines.push(`#EXT-X-ORDER:${itemIndex++}`);
          lines.push(`#EXT-X-TYPE:${typeTag}`);
          lines.push(`#EXT-X-GROUP:${label}`);
          lines.push(`${baseUrl}/iptv/tv/${tv.identificador}/content/${midia.id}`);
        }
      }
    }

    if (itemIndex === 0) {
      lines.push('#EXTINF:0,No Content Scheduled');
      lines.push(`${baseUrl}/iptv/tv/_/content/_empty`);
    }

    lines.push('#EXT-X-ENDLIST');
    return lines.join('\n');
  }

  async getCurrentContent(tvId: string) {
    const tv = await this.prisma.tv.findFirst({
      where: { id: tvId, deletedAt: null },
    });

    if (!tv) throw new NotFoundException('TV não encontrada');

    const now = new Date();
    const currentDay = this.getDiaSemana(now);
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const agendamento = await this.prisma.agendamento.findFirst({
      where: {
        tvId,
        tenantId: tv.tenantId,
        status: { in: ['scheduled', 'playing'] },
        diasSemana: { has: currentDay },
        dataInicio: { lte: now },
        AND: [
          { OR: [{ dataFim: null }, { dataFim: { gte: now } }] },
          { horarioInicio: { lte: currentTime } },
          { OR: [{ horarioFim: null }, { horarioFim: { gte: currentTime } }] },
        ],
      },
      include: {
        campanha: {
          include: {
            midias: {
              orderBy: { ordem: 'asc' },
              include: { midia: true },
            },
          },
        },
        playlist: {
          include: {
            itens: {
              orderBy: { ordem: 'asc' },
              include: { midia: true },
            },
          },
        },
      },
      orderBy: [
        { campanha: { prioridade: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    if (!agendamento) {
      return {
        tv: { id: tv.id, nome: tv.nome, identificador: tv.identificador },
        playing: false,
        message: 'Nenhum conteúdo agendado no momento',
      };
    }

    const items = this.extractItems(agendamento);
    const currentIndex = this.getCurrentItemIndex(items, now);

    return {
      tv: { id: tv.id, nome: tv.nome, identificador: tv.identificador, status: tv.status },
      playing: true,
      agendamento: {
        id: agendamento.id,
        nome: agendamento.nome,
        horarioInicio: agendamento.horarioInicio,
        horarioFim: agendamento.horarioFim,
      },
      source: agendamento.campanha
        ? { type: 'campanha', id: agendamento.campanha.id, nome: agendamento.campanha.nome }
        : { type: 'playlist', id: agendamento.playlist.id, nome: agendamento.playlist.nome },
      currentIndex,
      totalItems: items.length,
      currentItem: items[currentIndex] || null,
      items,
    };
  }

  async getTvPlaylists(tvId: string) {
    const tv = await this.prisma.tv.findFirst({
      where: { id: tvId, deletedAt: null },
    });

    if (!tv) throw new NotFoundException('TV não encontrada');

    const now = new Date();
    const currentDay = this.getDiaSemana(now);

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        tvId,
        tenantId: tv.tenantId,
        status: { in: ['scheduled', 'playing'] },
        diasSemana: { has: currentDay },
        dataInicio: { lte: now },
        OR: [{ dataFim: null }, { dataFim: { gte: now } }],
      },
      include: {
        campanha: {
          include: {
            midias: {
              orderBy: { ordem: 'asc' },
              include: { midia: { select: { id: true, nome: true, tipo: true, url: true, duracao: true } } },
            },
          },
        },
        playlist: {
          include: {
            itens: {
              orderBy: { ordem: 'asc' },
              include: { midia: { select: { id: true, nome: true, tipo: true, url: true, duracao: true } } },
            },
          },
        },
      },
      orderBy: [
        { horarioInicio: 'asc' },
        { campanha: { prioridade: 'desc' } },
      ],
    });

    return agendamentos.map((a) => ({
      id: a.id,
      nome: a.nome,
      horarioInicio: a.horarioInicio,
      horarioFim: a.horarioFim,
      diasSemana: a.diasSemana,
      status: a.status,
      fonte: a.campanha
        ? {
            tipo: 'campanha',
            id: a.campanha.id,
            nome: a.campanha.nome,
            midias: a.campanha.midias.map((m) => ({
              id: m.midia.id,
              nome: m.midia.nome,
              tipo: m.midia.tipo,
              ordem: m.ordem,
              duracao: m.duracao ?? m.midia.duracao,
            })),
          }
        : a.playlist
          ? {
              tipo: 'playlist',
              id: a.playlist.id,
              nome: a.playlist.nome,
              itens: a.playlist.itens.map((i) => ({
                id: i.midia.id,
                nome: i.midia.nome,
                tipo: i.midia.tipo,
                ordem: i.ordem,
                duracao: i.duracao ?? i.midia.duracao,
              })),
            }
          : null,
    }));
  }

  async getContent(tvId: string, midiaId: string) {
    if (tvId !== '_') {
      const tv = await this.prisma.tv.findFirst({
        where: { identificador: tvId, deletedAt: null },
      });
      if (!tv) throw new NotFoundException('TV não encontrada');
    }

    const midia = await this.prisma.midia.findUnique({
      where: { id: midiaId },
    });
    if (!midia) throw new NotFoundException('Mídia não encontrada');

    const buffer = await this.storage.download(midia.url);
    return { buffer, mimetype: midia.mimeType, nome: midia.nome, duracao: midia.duracao };
  }

  async getTvStatus(identificador: string) {
    const tv = await this.prisma.tv.findFirst({
      where: { identificador, deletedAt: null },
      include: {
        estabelecimento: { select: { id: true, nome: true } },
      },
    });

    if (!tv) throw new NotFoundException('TV não encontrada');

    const activeAgendamentos = await this.prisma.agendamento.count({
      where: {
        tvId: tv.id,
        status: { in: ['scheduled', 'playing'] },
      },
    });

    return {
      id: tv.id,
      identificador: tv.identificador,
      nome: tv.nome,
      status: tv.status,
      ipAddress: tv.ipAddress,
      lastPingAt: tv.ultimoPing,
      volume: tv.volume,
      resolucao: tv.resolucao,
      rotacaoAutomatica: tv.rotacaoAutomatica,
      intervaloRotacao: tv.intervaloRotacao,
      estabelecimento: tv.estabelecimento,
      activeAgendamentos,
    };
  }

  private getDiaSemana(date: Date): string {
    const dias: Record<number, string> = {
      0: 'domingo',
      1: 'segunda',
      2: 'terca',
      3: 'quarta',
      4: 'quinta',
      5: 'sexta',
      6: 'sabado',
    };
    return dias[date.getDay()];
  }

  private getTypeTag(tipo: string, mimeType: string): string {
    switch (tipo) {
      case 'video':
        return `type="video/${mimeType?.split('/')[1] || 'mp4'}"`;
      case 'image':
        return `type="image/${mimeType?.split('/')[1] || 'jpeg'}"`;
      case 'audio':
        return `type="audio/${mimeType?.split('/')[1] || 'mp3'}"`;
      default:
        return `type="video/mp2t"`;
    }
  }

  private extractItems(agendamento: any): any[] {
    if (agendamento.campanha) {
      return agendamento.campanha.midias.map((cm: any) => ({
        id: cm.midia.id,
        nome: cm.midia.nome,
        tipo: cm.midia.tipo,
        url: cm.midia.url,
        duracao: cm.duracao ?? cm.midia.duracao ?? 10,
        ordem: cm.ordem,
      }));
    }
    if (agendamento.playlist) {
      return agendamento.playlist.itens.map((item: any) => ({
        id: item.midia.id,
        nome: item.midia.nome,
        tipo: item.midia.tipo,
        url: item.midia.url,
        duracao: item.duracao ?? item.midia.duracao ?? 10,
        ordem: item.ordem,
      }));
    }
    return [];
  }

  private getCurrentItemIndex(items: any[], now: Date): number {
    if (items.length === 0) return -1;

    let totalElapsed = 0;
    const epoch = new Date('2024-01-01T00:00:00').getTime();
    const currentMs = now.getTime();

    for (let i = 0; i < items.length; i++) {
      totalElapsed += (items[i].duracao || 10) * 1000;
    }

    if (totalElapsed === 0) return 0;

    const cycleTime = (currentMs - epoch) % totalElapsed;
    let acc = 0;

    for (let i = 0; i < items.length; i++) {
      acc += (items[i].duracao || 10) * 1000;
      if (cycleTime < acc) return i;
    }

    return 0;
  }
}