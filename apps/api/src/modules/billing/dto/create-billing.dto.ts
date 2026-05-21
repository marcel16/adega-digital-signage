import { IsString, IsOptional, IsEnum, IsNumber, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BillingPlanInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  WEEKLY = 'WEEKLY',
}

export class CreateCheckoutDto {
  @ApiProperty()
  @IsString()
  planId: string;

  @ApiPropertyOptional({ enum: BillingPlanInterval, default: BillingPlanInterval.MONTHLY })
  @IsOptional()
  @IsEnum(BillingPlanInterval)
  interval?: BillingPlanInterval;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  planId: string;

  @ApiProperty({ enum: BillingPlanInterval })
  @IsEnum(BillingPlanInterval)
  interval: BillingPlanInterval;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId?: string;
}

export class BillingFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}

export class AsaasWebhookDto {
  @ApiProperty()
  @IsString()
  event: string;

  @ApiProperty()
  @IsObject()
  payment: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  subscription?: any;
}
