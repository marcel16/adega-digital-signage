import { Controller, Get, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditFilterDto } from './dto/create-audit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs with filters' })
  async findAll(@Query() filter: AuditFilterDto) {
    return this.auditService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  async findById(@Param('id') id: string) {
    return this.auditService.findById(id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs (CSV/JSON)' })
  async export(@Query() filter: AuditFilterDto, @Res() res: Response) {
    const result = await this.auditService.export(filter);
    if (result.format === 'csv') {
      const headers = 'id,action,entity,entityId,userId,createdAt\n';
      const rows = result.data.map(r => `${r.id},${r.action},${r.entity},${r.entityId},${r.userId},${r.createdAt}`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
      res.send(headers + rows);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-log.json"');
      res.json(result.data);
    }
  }
}
