import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateCheckoutDto, CreateSubscriptionDto, CancelSubscriptionDto, ValidateCouponDto, BillingFilterDto, AsaasWebhookDto } from './dto/create-billing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List available plans' })
  async getPlans() {
    return this.billingService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create checkout/charge' })
  async createCheckout(@Body() dto: CreateCheckoutDto, @TenantId() tenantId: string) {
    return this.billingService.createCheckout(dto, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscription')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create subscription' })
  async createSubscription(@Body() dto: CreateSubscriptionDto, @TenantId() tenantId: string) {
    return this.billingService.createSubscription(dto, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@Body() dto: CancelSubscriptionDto, @TenantId() tenantId: string) {
    return this.billingService.cancelSubscription(dto, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  async getInvoices(@TenantId() tenantId: string, @Query() filter: BillingFilterDto) {
    return this.billingService.getInvoices(tenantId, filter);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('subscription/status')
  @ApiOperation({ summary: 'Get subscription status' })
  async getSubscriptionStatus(@TenantId() tenantId: string) {
    return this.billingService.getSubscriptionStatus(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('coupon/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate coupon code' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.billingService.validateCoupon(dto);
  }

  @Public()
  @Post('webhook/asaas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asaas webhook handler' })
  async webhook(@Body() dto: AsaasWebhookDto) {
    return this.billingService.handleAsaasWebhook(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('history')
  @ApiOperation({ summary: 'Get billing history' })
  async getHistory(@TenantId() tenantId: string) {
    return this.billingService.getHistory(tenantId);
  }
}
