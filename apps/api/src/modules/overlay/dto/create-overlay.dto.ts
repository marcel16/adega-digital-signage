import { IsString, IsOptional, IsEnum, IsObject, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OverlayType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  PRICE = 'PRICE',
  QRCODE = 'QRCODE',
  CLOCK = 'CLOCK',
  WEATHER = 'WEATHER',
  HTML = 'HTML',
}

export enum OverlayPosition {
  TOP_LEFT = 'TOP_LEFT',
  TOP_CENTER = 'TOP_CENTER',
  TOP_RIGHT = 'TOP_RIGHT',
  MIDDLE_LEFT = 'MIDDLE_LEFT',
  MIDDLE_CENTER = 'MIDDLE_CENTER',
  MIDDLE_RIGHT = 'MIDDLE_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_CENTER = 'BOTTOM_CENTER',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
}

export class CreateOverlayDto {
  @ApiProperty()
  @IsString()
  campaignId: string;

  @ApiProperty({ enum: OverlayType })
  @IsEnum(OverlayType)
  type: OverlayType;

  @ApiProperty()
  @IsObject()
  config: Record<string, any>;

  @ApiPropertyOptional({ enum: OverlayPosition, default: OverlayPosition.BOTTOM_RIGHT })
  @IsOptional()
  @IsEnum(OverlayPosition)
  position?: OverlayPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  zIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}

export class UpdateOverlayDto {
  @ApiPropertyOptional({ enum: OverlayType })
  @IsOptional()
  @IsEnum(OverlayType)
  type?: OverlayType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ enum: OverlayPosition })
  @IsOptional()
  @IsEnum(OverlayPosition)
  position?: OverlayPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  zIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}

export class ReorderOverlaysDto {
  @ApiProperty({ example: [{ id: 'overlay1', zIndex: 1 }] })
  @IsObject({ each: true })
  items: { id: string; zIndex: number }[];
}

export class OverlayFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ enum: OverlayType })
  @IsOptional()
  @IsEnum(OverlayType)
  type?: OverlayType;
}
