import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get tenant dashboard stats' })
  async getStats(@TenantId() tenantId: string) {
    return this.dashboardService.getStats(tenantId);
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity logs' })
  async getRecentActivity(@TenantId() tenantId: string) {
    return this.dashboardService.getRecentActivity(tenantId);
  }

  @Get('storage-usage')
  @ApiOperation({ summary: 'Get storage usage by media type' })
  async getStorageUsage(@TenantId() tenantId: string) {
    return this.dashboardService.getStorageUsage(tenantId);
  }
}
