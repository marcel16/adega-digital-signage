import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, UpdateScheduleDto, UpdateScheduleStatusDto, ScheduleFilterDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'List schedules with filters' })
  async findAll(@TenantId() tenantId: string, @Query() filter: ScheduleFilterDto) {
    return this.scheduleService.findAll(tenantId, filter);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new schedule' })
  async create(@Body() dto: CreateScheduleDto, @TenantId() tenantId: string) {
    return this.scheduleService.create(dto, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.scheduleService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update schedule' })
  async update(@Param('id') id: string, @Body() dto: UpdateScheduleDto, @TenantId() tenantId: string) {
    return this.scheduleService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete schedule' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.scheduleService.remove(id, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update schedule status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateScheduleStatusDto, @TenantId() tenantId: string) {
    return this.scheduleService.updateStatus(id, dto, tenantId);
  }

  @Get('tv/:tvId/now')
  @ApiOperation({ summary: 'Get currently playing content for TV' })
  async getNowPlaying(@Param('tvId') tvId: string, @TenantId() tenantId: string) {
    return this.scheduleService.getNowPlaying(tvId, tenantId);
  }

  @Get('tv/:tvId/today')
  @ApiOperation({ summary: "Get today's full schedule for TV" })
  async getTodaySchedule(@Param('tvId') tvId: string, @TenantId() tenantId: string) {
    return this.scheduleService.getTodaySchedule(tvId, tenantId);
  }
}
