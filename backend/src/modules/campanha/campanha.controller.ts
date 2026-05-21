import {
  Controller, Get, Post, Body, Param, Put, Delete, Patch, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampanhaService } from './campanha.service';
import { CreateCampanhaDto, CampanhaMidiaDto } from './dto/create-campanha.dto';
import { UpdateCampanhaDto } from './dto/update-campanha.dto';
import { CampanhaFilterDto } from './dto/campanha-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Campanhas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campanhas')
export class CampanhaController {
  constructor(private campanhaService: CampanhaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova campanha' })
  create(
    @Body() dto: CreateCampanhaDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.campanhaService.create(dto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar campanhas' })
  findAll(@Query() filters: CampanhaFilterDto, @TenantId() tenantId: string) {
    return this.campanhaService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter campanha por ID' })
  findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.campanhaService.findById(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar campanha' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCampanhaDto,
    @TenantId() tenantId: string,
  ) {
    return this.campanhaService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover campanha' })
  delete(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.campanhaService.delete(id, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Alterar status da campanha (activate, pause, complete, cancel)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @TenantId() tenantId: string,
  ) {
    return this.campanhaService.updateStatus(id, status, tenantId);
  }

  @Post(':id/midias')
  @ApiOperation({ summary: 'Adicionar mídia à campanha' })
  addMidia(
    @Param('id') id: string,
    @Body() dto: CampanhaMidiaDto,
    @TenantId() tenantId: string,
  ) {
    return this.campanhaService.addMidia(id, dto, tenantId);
  }

  @Delete(':id/midias/:midiaId')
  @ApiOperation({ summary: 'Remover mídia da campanha' })
  removeMidia(
    @Param('id') id: string,
    @Param('midiaId') midiaId: string,
    @TenantId() tenantId: string,
  ) {
    return this.campanhaService.removeMidia(id, midiaId, tenantId);
  }

  @Put(':id/midias/reorder')
  @ApiOperation({ summary: 'Reordenar mídias da campanha' })
  reorderMidias(
    @Param('id') id: string,
    @Body('ordem') ordem: { midiaId: string; ordem: number }[],
    @TenantId() tenantId: string,
  ) {
    return this.campanhaService.reorderMidias(id, ordem, tenantId);
  }
}