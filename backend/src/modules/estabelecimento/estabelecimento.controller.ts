import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { EstabelecimentoService } from './estabelecimento.service';
import { CreateEstabelecimentoDto } from './dto/create-estabelecimento.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Estabelecimentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('estabelecimentos')
export class EstabelecimentoController {
  constructor(private readonly service: EstabelecimentoService) {}

  @Post()
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Criar estabelecimento' })
  create(@Body() dto: CreateEstabelecimentoDto, @TenantId() tenantId: string, @CurrentUser('id') userId: string) {
    return this.service.create(dto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar estabelecimentos' })
  findAll(@Query() query: PaginationDto, @TenantId() tenantId: string) {
    return this.service.findAll(query, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter estabelecimento' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Put(':id')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Atualizar estabelecimento' })
  update(@Param('id') id: string, @Body() dto: CreateEstabelecimentoDto, @TenantId() tenantId: string) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Remover estabelecimento' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}