import { IsString, IsOptional, IsEnum, IsInt, Min, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaylistItemDto {
  @ApiProperty({ description: 'ID da mídia' })
  @IsUUID()
  midiaId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @ApiPropertyOptional({ description: 'Duração em segundos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duracao?: number;
}

export class CreatePlaylistDto {
  @ApiProperty({ description: 'Nome da playlist' })
  @IsString()
  nome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ enum: ['principal', 'promocional', 'institucional', 'emergencia', 'custom'] })
  @IsEnum(['principal', 'promocional', 'institucional', 'emergencia', 'custom'])
  tipo: 'principal' | 'promocional' | 'institucional' | 'emergencia' | 'custom';

  @ApiPropertyOptional({ type: [PlaylistItemDto], description: 'Itens da playlist' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaylistItemDto)
  itens?: PlaylistItemDto[];
}