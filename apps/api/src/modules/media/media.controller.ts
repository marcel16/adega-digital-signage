import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto, UpdateMediaDto, MediaFilterDto, ImportYouTubeDto } from './dto/create-media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { memoryStorage } from 'multer';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'List media with filters and pagination' })
  async findAll(@TenantId() tenantId: string, @Query() filter: MediaFilterDto) {
    return this.mediaService.findAll(tenantId, filter);
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload media file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @TenantId() tenantId: string,
    @Body('name') name?: string,
    @Body('description') description?: string,
    @Body('tags') tags?: string,
  ) {
    const parsedTags = tags ? JSON.parse(tags) : undefined;
    return this.mediaService.upload(file, tenantId, name, description, parsedTags);
  }

  @Post('youtube')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Import YouTube video' })
  async importYouTube(@Body() dto: ImportYouTubeDto, @TenantId() tenantId: string) {
    return this.mediaService.importYouTube(dto, tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get media statistics by type and usage' })
  async getStats(@TenantId() tenantId: string) {
    return this.mediaService.getStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.mediaService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media metadata' })
  async update(@Param('id') id: string, @Body() dto: UpdateMediaDto, @TenantId() tenantId: string) {
    return this.mediaService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete media' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.mediaService.remove(id, tenantId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get media download URL' })
  async download(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.mediaService.getDownloadUrl(id, tenantId);
  }
}
