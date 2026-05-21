import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CampanhaMidiaDto {
  @ApiProperty({ description: 'ID da mídia' })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  duracao?: number;
}

export class CreateCampanhaDto {
  @ApiProperty({ description: 'Nome da campanha' })
  @IsString()
  nome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ enum: ['principal', 'promocional', 'institucional', 'emergencia', 'custom'] })
  @IsEnum(['principal', 'promocional', 'institucional', 'emergencia', 'custom'])
  tipo: 'principal' | 'promocional' | 'institucional' | 'emergencia' | 'custom';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  prioridade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  estabelecimentoId?: string;

  @ApiPropertyOptional({ type: [CampanhaMidiaDto], description: 'Mídias associadas com ordem e duração' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampanhaMidiaDto)
  midiaIds?: CampanhaMidiaDto[];
}