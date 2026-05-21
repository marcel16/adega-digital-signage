import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookPaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subscription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankSlipUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pixQrCodeUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pixCopiaECola?: string;

  @ApiPropertyOptional()
  @IsOptional()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  netValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class WebhookDto {
  @ApiProperty({ description: 'Tipo de evento do webhook' })
  @IsString()
  event: string;

  @ApiProperty({ description: 'Dados do pagamento' })
  @IsObject()
  payment: WebhookPaymentDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  subscription?: any;
}