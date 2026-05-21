import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PingTvDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;
}