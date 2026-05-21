import { Controller, Get, Post, Patch, Delete, Put, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreatePlanDto, UpdatePlanDto, UpdateSystemSettingsDto, AdminFilterDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get global dashboard stats' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('clients')
  @ApiOperation({ summary: 'List all tenants' })
  async getClients(@Query() filter: AdminFilterDto) {
    return this.adminService.getClients(filter);
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async getClientById(@Param('id') id: string) {
    return this.adminService.getClientById(id);
  }

  @Patch('clients/:id/block')
  @ApiOperation({ summary: 'Block/unblock tenant' })
  async blockClient(@Param('id') id: string, @Body('blocked') blocked: boolean) {
    return this.adminService.blockClient(id, blocked);
  }

  @Get('stores')
  @ApiOperation({ summary: 'List all stores' })
  async getStores(@Query() filter: AdminFilterDto) {
    return this.adminService.getStores(filter);
  }

  @Get('tvs')
  @ApiOperation({ summary: 'List all TVs' })
  async getTvs(@Query() filter: AdminFilterDto) {
    return this.adminService.getTvs(filter);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  async getUsers(@Query() filter: AdminFilterDto) {
    return this.adminService.getUsers(filter);
  }

  @Get('payments')
  @ApiOperation({ summary: 'List all payments' })
  async getPayments(@Query() filter: AdminFilterDto) {
    return this.adminService.getPayments(filter);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all plans' })
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new plan' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.adminService.createPlan(dto);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update a plan' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.adminService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plan' })
  async deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }

  @Put('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update system settings' })
  async updateSettings(@Body() dto: UpdateSystemSettingsDto) {
    return this.adminService.updateSettings(dto);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  async getMetrics() {
    return this.adminService.getMetrics();
  }
}
