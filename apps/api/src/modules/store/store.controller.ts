import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreDto, UpdateStoreDto, BlockStoreDto, StoreFilterDto } from './dto/create-store.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @ApiOperation({ summary: 'List stores by tenant' })
  async findAll(@TenantId() tenantId: string, @Query() filter: StoreFilterDto) {
    return this.storeService.findAll(tenantId, filter);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new store' })
  async create(@Body() dto: CreateStoreDto, @TenantId() tenantId: string) {
    return this.storeService.create(dto, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.storeService.findById(id, tenantId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get store by code' })
  async findByCode(@Param('code') code: string) {
    return this.storeService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update store' })
  async update(@Param('id') id: string, @Body() dto: UpdateStoreDto, @TenantId() tenantId: string) {
    return this.storeService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete store' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.storeService.remove(id, tenantId);
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Block or unblock store' })
  async block(@Param('id') id: string, @Body() dto: BlockStoreDto, @TenantId() tenantId: string) {
    return this.storeService.block(id, dto, tenantId);
  }
}
