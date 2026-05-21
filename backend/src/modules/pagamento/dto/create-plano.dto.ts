import { IsString, IsOptional, IsNumber, IsBoolean, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanoDto {
  @ApiProperty({ description: 'Nome do plano' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Slug único do plano' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Descrição do plano' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ description: 'Valor mensal do plano' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor: number;

  @ApiProperty({ description: 'Ciclo de cobrança (monthly, yearly, etc.)', default: 'monthly' })
  @IsString()
  ciclo: string = 'monthly';

  @ApiProperty({ description: 'Máximo de estabelecimentos', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxEstabelecimentos: number = 1;

  @ApiProperty({ description: 'Máximo de TVs', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTvs: number = 1;

  @ApiProperty({ description: 'Máximo de mídias', default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMidias: number = 50;

  @ApiProperty({ description: 'Armazenamento máximo em MB', default: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxArmazenamentoMb: number = 500;

  @ApiPropertyOptional({ description: 'Recursos do plano (JSON string)' })
  @IsOptional()
  @IsString()
  recursos?: string;

  @ApiProperty({ description: 'Ordem de exibição', default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordem: number = 0;

  @ApiProperty({ description: 'Plano em destaque', default: false })
  @IsBoolean()
  destaque: boolean = false;
}