import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas do dashboard' })
  getStats(@TenantId() tenantId: string) {
    return this.service.getStats(tenantId);
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Obter atividades recentes' })
  getRecentActivity(@TenantId() tenantId: string) {
    return this.service.getRecentActivity(tenantId);
  }
}