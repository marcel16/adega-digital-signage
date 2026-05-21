import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportYouTubeDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  tags?: string[];
}

export class GetYouTubeInfoDto {
  @ApiProperty()
  @IsString()
  url: string;
}

export class ValidateYouTubeDto {
  @ApiProperty()
  @IsString()
  url: string;
}
