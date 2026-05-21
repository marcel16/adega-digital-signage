import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ImportYouTubeDto, GetYouTubeInfoDto, ValidateYouTubeDto } from './dto/create-youtube.dto';

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);

  constructor(private prisma: PrismaService) {}

  private extractYoutubeId(url: string): string {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    if (!match) throw new BadRequestException('Invalid YouTube URL');
    return match[1];
  }

  private async getVideoInfo(url: string) {
    try {
      const response = await axios.get(`https://www.youtube.com/oembed?url=${url}&format=json`);
      return response.data;
    } catch {
      return { title: 'Unknown', author_name: 'Unknown', thumbnail_url: null };
    }
  }

  async importVideo(dto: ImportYouTubeDto, tenantId: string) {
    const youtubeId = this.extractYoutubeId(dto.url);
    const info = await this.getVideoInfo(dto.url);

    const media = await this.prisma.media.create({
      data: {
        name: dto.name || info.title || 'YouTube Video',
        description: `YouTube video by ${info.author_name || 'Unknown'}`,
        type: 'YOUTUBE',
        youtubeUrl: dto.url,
        youtubeId,
        thumbnailUrl: info.thumbnail_url || null,
        tags: dto.tags || [],
        tenantId,
      },
    });

    return media;
  }

  async getInfo(dto: GetYouTubeInfoDto) {
    this.extractYoutubeId(dto.url);
    const info = await this.getVideoInfo(dto.url);
    return info;
  }

  async validate(dto: ValidateYouTubeDto) {
    try {
      const id = this.extractYoutubeId(dto.url);
      const info = await this.getVideoInfo(dto.url);
      return { valid: true, youtubeId: id, title: info.title || null };
    } catch {
      return { valid: false, youtubeId: null, title: null };
    }
  }
}
