import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class IptvQueryDto {
  @ApiPropertyOptional({ description: 'Token de acesso da TV' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({ description: 'Formato de saída' })
  @IsOptional()
  @IsString()
  format?: string;
}