import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiaSemana } from '@prisma/client';

export class CreateAgendamentoDto {
  @ApiProperty({ description: 'Nome do agendamento' })
  @IsString()
  nome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ enum: DiaSemana, isArray: true, description: 'Dias da semana' })
  @IsArray()
  @IsEnum(DiaSemana, { each: true })
  diasSemana: DiaSemana[];

  @ApiProperty({ description: 'Horário de início (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'horarioInicio deve estar no formato HH:mm' })
  horarioInicio: string;

  @ApiPropertyOptional({ description: 'Horário de fim (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'horarioFim deve estar no formato HH:mm' })
  horarioFim?: string;

  @ApiProperty({ description: 'Data de início (ISO 8601)' })
  @IsString()
  dataInicio: string;

  @ApiPropertyOptional({ description: 'Data de fim (ISO 8601)' })
  @IsOptional()
  @IsString()
  dataFim?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  recorrente?: boolean;

  @ApiProperty({ description: 'ID da TV' })
  @IsUUID()
  tvId: string;

  @ApiPropertyOptional({ description: 'ID da campanha' })
  @IsOptional()
  @IsUUID()
  campanhaId?: string;

  @ApiPropertyOptional({ description: 'ID da playlist' })
  @IsOptional()
  @IsUUID()
  playlistId?: string;
}