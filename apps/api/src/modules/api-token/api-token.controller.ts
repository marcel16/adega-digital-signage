import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiTokenService } from './api-token.service';
import { CreateApiTokenDto, ApiTokenFilterDto } from './dto/create-api-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('API Tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-tokens')
export class ApiTokenController {
  constructor(private readonly apiTokenService: ApiTokenService) {}

  @Get()
  @ApiOperation({ summary: 'List API tokens' })
  async findAll(@TenantId() tenantId: string, @Query() filter: ApiTokenFilterDto) {
    return this.apiTokenService.findAll(tenantId, filter);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate new API token' })
  async create(@Body() dto: CreateApiTokenDto, @TenantId() tenantId: string) {
    return this.apiTokenService.create(dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke API token' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.apiTokenService.remove(id, tenantId);
  }
}
