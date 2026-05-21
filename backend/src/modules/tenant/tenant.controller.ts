import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Criar tenant' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Listar tenants' })
  findAll(@Query() query: PaginationDto) {
    return this.tenantService.findAll(query);
  }

  @Get(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Obter tenant por ID' })
  findById(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }

  @Patch(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Atualizar tenant' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Atualizar status do tenant' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tenantService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Remover tenant' })
  delete(@Param('id') id: string) {
    return this.tenantService.delete(id);
  }

  @Get(':id/stats')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Estatísticas do tenant' })
  getStats(@Param('id') id: string) {
    return this.tenantService.getStats(id);
  }
}