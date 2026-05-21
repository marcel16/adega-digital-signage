import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { YouTubeService } from './youtube.service';
import { ImportYouTubeDto, GetYouTubeInfoDto, ValidateYouTubeDto } from './dto/create-youtube.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('YouTube')
@Controller('youtube')
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Import YouTube video by URL' })
  async importVideo(@Body() dto: ImportYouTubeDto, @TenantId() tenantId: string) {
    return this.youtubeService.importVideo(dto, tenantId);
  }

  @Public()
  @Post('info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get YouTube video info from URL' })
  async getInfo(@Body() dto: GetYouTubeInfoDto) {
    return this.youtubeService.getInfo(dto);
  }

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate if URL is a valid YouTube video' })
  async validate(@Body() dto: ValidateYouTubeDto) {
    return this.youtubeService.validate(dto);
  }
}
