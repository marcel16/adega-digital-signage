import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class MidiaFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['image', 'video', 'audio', 'url', 'html'] })
  @IsOptional()
  @IsEnum(['image', 'video', 'audio', 'url', 'html'])
  tipo?: string;

  @ApiPropertyOptional({ enum: ['processing', 'ready', 'error'] })
  @IsOptional()
  @IsEnum(['processing', 'ready', 'error'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pasta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}