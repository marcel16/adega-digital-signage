import { Controller, Get, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, UpdateAsaasConfigDto } from './dto/create-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all system settings' })
  async findAll() {
    return this.settingsService.findAll();
  }

  @Patch()
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update system settings' })
  async update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }

  @Get('asaas')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get Asaas configuration' })
  async getAsaasConfig() {
    return this.settingsService.getAsaasConfig();
  }

  @Patch('asaas')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Asaas configuration' })
  async updateAsaasConfig(@Body() dto: UpdateAsaasConfigDto) {
    return this.settingsService.updateAsaasConfig(dto);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get setting by key' })
  async findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }
}
