import { IsUUID, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddItemDto {
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

export class ReorderItemsDto {
  @ApiProperty({ description: 'Array de { itemId, ordem }' })
  itens: { itemId: string; ordem: number }[];
}