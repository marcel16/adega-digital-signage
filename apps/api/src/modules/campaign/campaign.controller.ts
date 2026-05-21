import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto, UpdateCampaignStatusDto, AddMediaToCampaignDto, ReorderMediaDto, CampaignFilterDto } from './dto/create-campaign.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @ApiOperation({ summary: 'List campaigns with filters' })
  async findAll(@TenantId() tenantId: string, @Query() filter: CampaignFilterDto) {
    return this.campaignService.findAll(tenantId, filter);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new campaign' })
  async create(@Body() dto: CreateCampaignDto, @TenantId() tenantId: string) {
    return this.campaignService.create(dto, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.campaignService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign' })
  async update(@Param('id') id: string, @Body() dto: UpdateCampaignDto, @TenantId() tenantId: string) {
    return this.campaignService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete campaign' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.campaignService.remove(id, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update campaign status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateCampaignStatusDto, @TenantId() tenantId: string) {
    return this.campaignService.updateStatus(id, dto, tenantId);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate campaign with overlays' })
  async duplicate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.campaignService.duplicate(id, tenantId);
  }

  @Post(':id/media')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add media to campaign' })
  async addMedia(@Param('id') id: string, @Body() dto: AddMediaToCampaignDto, @TenantId() tenantId: string) {
    return this.campaignService.addMedia(id, dto, tenantId);
  }

  @Delete(':id/media/:mediaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove media from campaign' })
  async removeMedia(@Param('id') id: string, @Param('mediaId') mediaId: string, @TenantId() tenantId: string) {
    return this.campaignService.removeMedia(id, mediaId, tenantId);
  }

  @Patch(':id/media/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder campaign media' })
  async reorderMedia(@Param('id') id: string, @Body() dto: ReorderMediaDto, @TenantId() tenantId: string) {
    return this.campaignService.reorderMedia(id, dto, tenantId);
  }
}
