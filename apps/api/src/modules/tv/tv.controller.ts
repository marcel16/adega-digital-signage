import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TvService } from './tv.service';
import { CreateTvDto, UpdateTvDto, UpdateTvStatusDto, TvFilterDto } from './dto/create-tv.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('TVs')
@Controller('tvs')
export class TvController {
  constructor(private readonly tvService: TvService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'List TVs by tenant/store' })
  async findAll(@TenantId() tenantId: string, @Query() filter: TvFilterDto) {
    return this.tvService.findAll(tenantId, filter);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new TV' })
  async create(@Body() dto: CreateTvDto, @TenantId() tenantId: string) {
    return this.tvService.create(dto, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get TV by ID' })
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.tvService.findById(id, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update TV' })
  async update(@Param('id') id: string, @Body() dto: UpdateTvDto, @TenantId() tenantId: string) {
    return this.tvService.update(id, dto, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete TV' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.tvService.remove(id, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/pair')
  @ApiOperation({ summary: 'Generate new pairing code' })
  async generatePairingCode(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.tvService.generatePairingCode(id, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/m3u')
  @ApiOperation({ summary: 'Get M3U URL for TV' })
  async getM3uUrl(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.tvService.getM3uUrl(id, tenantId);
  }

  @Public()
  @Post('ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ping from TV (heartbeat)' })
  async ping(@Body() body: { pairingCode?: string; token?: string; status?: string }) {
    return this.tvService.ping(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update TV status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateTvStatusDto, @TenantId() tenantId: string) {
    return this.tvService.updateStatus(id, dto, tenantId);
  }
}
