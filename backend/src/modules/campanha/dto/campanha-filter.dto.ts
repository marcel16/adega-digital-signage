import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CampanhaFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['draft', 'active', 'paused', 'completed', 'canceled'] })
  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'completed', 'canceled'])
  status?: string;

  @ApiPropertyOptional({ enum: ['principal', 'promocional', 'institucional', 'emergencia', 'custom'] })
  @IsOptional()
  @IsEnum(['principal', 'promocional', 'institucional', 'emergencia', 'custom'])
  tipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  estabelecimentoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}