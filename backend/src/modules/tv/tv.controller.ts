import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TvService } from './tv.service';
import { CreateTvDto } from './dto/create-tv.dto';
import { UpdateTvDto } from './dto/update-tv.dto';
import { PingTvDto } from './dto/ping-tv.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('TVs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tvs')
export class TvController {
  constructor(private tvService: TvService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova TV' })
  create(@Body() dto: CreateTvDto, @TenantId() tenantId: string) {
    return this.tvService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar TVs' })
  findAll(
    @Query() query: PaginationDto,
    @Query('estabelecimentoId') estabelecimentoId: string | undefined,
    @TenantId() tenantId: string,
  ) {
    return this.tvService.findAll(query, tenantId, estabelecimentoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter TV por ID' })
  findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.tvService.findById(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar TV' })
  update(@Param('id') id: string, @Body() dto: UpdateTvDto, @TenantId() tenantId: string) {
    return this.tvService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover TV (soft delete)' })
  delete(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.tvService.delete(id, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status da TV' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @TenantId() tenantId: string,
  ) {
    return this.tvService.updateStatus(id, status, tenantId);
  }

  @Public()
  @Post('ping')
  @ApiOperation({ summary: 'Heartbeat da TV (público)' })
  ping(@Body('identificador') identificador: string, @Body() dto: PingTvDto) {
    return this.tvService.ping(identificador, dto);
  }
}