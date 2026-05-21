import { Controller, Get, Param, Query, UseGuards, Header, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaFilterDto } from './dto/auditoria-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Auditoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private auditoriaService: AuditoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar logs de auditoria com filtros' })
  findAll(@Query() filters: AuditoriaFilterDto) {
    return this.auditoriaService.list(filters);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar logs de auditoria como CSV' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="auditoria.csv"')
  async export(@Query() filters: AuditoriaFilterDto, @Res() res: Response) {
    const { csv } = await this.auditoriaService.export(filters);
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter log de auditoria por ID' })
  findById(@Param('id') id: string) {
    return this.auditoriaService.findById(id);
  }
}