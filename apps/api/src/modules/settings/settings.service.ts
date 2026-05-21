import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { UpdateSettingsDto, UpdateAsaasConfigDto } from './dto/create-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  async findAll() {
    const settings = await this.prisma.systemSetting.findMany();
    const result: Record<string, any> = {};
    for (const s of settings) {
      try { result[s.key] = JSON.parse(s.value); } catch { result[s.key] = s.value; }
    }
    return result;
  }

  async update(dto: UpdateSettingsDto) {
    for (const [key, value] of Object.entries(dto.settings)) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        create: { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
        update: { value: typeof value === 'string' ? value : JSON.stringify(value) },
      });
    }
    this.appLogger.audit('SETTINGS_UPDATED', 'Settings', 'system', 'system');
    return { success: true };
  }

  async getAsaasConfig() {
    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { in: ['asaas_api_url', 'asaas_api_token', 'asaas_wallet_id'] } },
    });
    const config: Record<string, string> = {};
    for (const s of settings) {
      if (s.key === 'asaas_api_token') {
        config[s.key.replace('asaas_', '')] = s.value ? `${s.value.substring(0, 4)}****` : '';
      } else {
        config[s.key.replace('asaas_', '')] = s.value || '';
      }
    }
    return config;
  }

  async updateAsaasConfig(dto: UpdateAsaasConfigDto) {
    const updates: Record<string, string> = {};
    if (dto.apiUrl) updates['asaas_api_url'] = dto.apiUrl;
    if (dto.apiToken) updates['asaas_api_token'] = dto.apiToken;
    if (dto.walletId) updates['asaas_wallet_id'] = dto.walletId;

    for (const [key, value] of Object.entries(updates)) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
    this.appLogger.audit('ASAAS_CONFIG_UPDATED', 'Settings', 'asaas', 'system');
    return { success: true };
  }

  async findByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) return { key, value: null };
    try { return { key, value: JSON.parse(setting.value) }; } catch { return { key, value: setting.value }; }
  }
}
