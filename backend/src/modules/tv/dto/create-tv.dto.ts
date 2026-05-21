import { IsString, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTvDto {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolucao?: string;

  @ApiProperty({ description: 'ID do estabelecimento' })
  @IsString()
  estabelecimentoId: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  volume?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  rotacaoAutomatica?: boolean;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(300)
  intervaloRotacao?: number;
}