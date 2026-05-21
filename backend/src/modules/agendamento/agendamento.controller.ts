import {
  Controller, Get, Post, Body, Param, Put, Delete, Patch, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgendamentoService } from './agendamento.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';
import { AgendamentoFilterDto } from './dto/agendamento-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AgendamentoStatus } from '@prisma/client';

@ApiTags('Agendamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agendamentos')
export class AgendamentoController {
  constructor(private agendamentoService: AgendamentoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  create(
    @Body() dto: CreateAgendamentoDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agendamentoService.create(dto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  findAll(@Query() filters: AgendamentoFilterDto, @TenantId() tenantId: string) {
    return this.agendamentoService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter agendamento por ID' })
  findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.agendamentoService.findById(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgendamentoDto,
    @TenantId() tenantId: string,
  ) {
    return this.agendamentoService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover agendamento' })
  delete(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.agendamentoService.delete(id, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Alterar status do agendamento' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AgendamentoStatus,
    @TenantId() tenantId: string,
  ) {
    return this.agendamentoService.updateStatus(id, status, tenantId);
  }

  @Get('tv/:tvId/current')
  @ApiOperation({ summary: 'Obter agendamento atual para uma TV' })
  getCurrentForTv(@Param('tvId') tvId: string) {
    return this.agendamentoService.getCurrentForTv(tvId);
  }
}