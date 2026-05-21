import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateCheckoutDto, CreateSubscriptionDto, CancelSubscriptionDto, ValidateCouponDto, AsaasWebhookDto } from './dto/create-billing.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private asaasApi: string;
  private asaasToken: string;

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {
    this.asaasApi = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
    this.asaasToken = process.env.ASAAS_API_TOKEN || '';
  }

  private getAsaasHeaders() {
    return {
      'access_token': this.asaasToken,
      'Content-Type': 'application/json',
    };
  }

  async getPlans() {
    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { startsWith: 'plan_' } },
    });
    if (settings.length > 0) {
      return settings.reduce((acc, s) => {
        try { acc[s.key.replace('plan_', '')] = JSON.parse(s.value); } catch {}
        return acc;
      }, {});
    }

    return [
      { id: 'free', name: 'Free', price: 0, interval: 'MONTHLY', maxTvs: 1, maxStorage: 50, features: ['1 TV', '50MB Storage'] },
      { id: 'basic', name: 'Basic', price: 29.90, interval: 'MONTHLY', maxTvs: 5, maxStorage: 100, features: ['5 TVs', '100MB Storage', 'Support'] },
      { id: 'professional', name: 'Professional', price: 99.90, interval: 'MONTHLY', maxTvs: 20, maxStorage: 500, features: ['20 TVs', '500MB Storage', 'Priority Support', 'API Access'] },
      { id: 'enterprise', name: 'Enterprise', price: 299.90, interval: 'MONTHLY', maxTvs: 100, maxStorage: 1024, features: ['100 TVs', '1GB Storage', 'Dedicated Support', 'API Access', 'Custom Branding'] },
    ];
  }

  async createCheckout(dto: CreateCheckoutDto, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    let discount = 0;
    if (dto.couponCode) {
      const coupon = await this.validateCouponCode(dto.couponCode);
      discount = coupon.discount;
    }

    const plans = await this.getPlans();
    const plan = plans.find((p: any) => p.id === dto.planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const total = Math.max(0, plan.price - discount);

    try {
      const response = await axios.post(`${this.asaasApi}/payments`, {
        customer: tenant.document || tenant.name,
        billingType: 'UNDEFINED',
        value: total,
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: `Plano ${plan.name} - ${dto.interval || 'MONTHLY'}`,
        externalReference: tenantId,
      }, { headers: this.getAsaasHeaders() });

      await this.prisma.invoice.create({
        data: {
          tenantId,
          asaasId: response.data.id,
          planId: dto.planId,
          amount: total,
          status: response.data.status || 'PENDING',
          dueDate: new Date(response.data.dueDate),
          metadata: dto.metadata || {},
        },
      });

      this.appLogger.audit('CHECKOUT_CREATED', 'Billing', response.data.id, tenantId, { planId: dto.planId, total });
      return response.data;
    } catch (error) {
      this.logger.error('Asaas checkout error', error?.response?.data || error.message);
      throw new BadRequestException('Failed to create checkout');
    }
  }

  async createSubscription(dto: CreateSubscriptionDto, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    let discount = 0;
    if (dto.couponCode) {
      const coupon = await this.validateCouponCode(dto.couponCode);
      discount = coupon.discount;
    }

    try {
      const response = await axios.post(`${this.asaasApi}/subscriptions`, {
        customer: tenant.document || tenant.name,
        billingType: 'UNDEFINED',
        value: 0,
        nextDueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        cycle: dto.interval === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
        description: `Assinatura ${dto.interval || 'MONTHLY'}`,
        externalReference: tenantId,
        discount: discount > 0 ? { value: discount, dueDateLimitDays: 0 } : undefined,
      }, { headers: this.getAsaasHeaders() });

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: dto.planId as any, subscriptionId: response.data.id },
      });

      this.appLogger.audit('SUBSCRIPTION_CREATED', 'Billing', response.data.id, tenantId, { planId: dto.planId });
      return response.data;
    } catch (error) {
      this.logger.error('Asaas subscription error', error?.response?.data || error.message);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  async cancelSubscription(dto: CancelSubscriptionDto, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.subscriptionId) throw new BadRequestException('No active subscription');

    try {
      await axios.delete(`${this.asaasApi}/subscriptions/${tenant.subscriptionId}`, {
        headers: this.getAsaasHeaders(),
        data: { reason: dto.reason || 'user_requested' },
      });

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: 'FREE', subscriptionId: null },
      });

      this.appLogger.audit('SUBSCRIPTION_CANCELLED', 'Billing', tenant.subscriptionId, tenantId, { reason: dto.reason });
    } catch (error) {
      this.logger.error('Asaas cancel error', error?.response?.data || error.message);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  async getInvoices(tenantId: string, filter: BillingFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where: { tenantId } }),
    ]);

    return paginate(data, total, page, limit);
  }

  async getSubscriptionStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true, subscriptionId: true, blocked: true } });
    return tenant;
  }

  async validateCoupon(dto: ValidateCouponDto) {
    return this.validateCouponCode(dto.code, dto.planId);
  }

  private async validateCouponCode(code: string, planId?: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon) throw new BadRequestException('Invalid coupon code');
    if (coupon.redeemed >= coupon.maxRedemptions) throw new BadRequestException('Coupon expired');
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new BadRequestException('Coupon expired');
    if (coupon.planId && planId && coupon.planId !== planId) throw new BadRequestException('Coupon not applicable to this plan');

    return coupon;
  }

  async handleAsaasWebhook(dto: AsaasWebhookDto) {
    this.logger.log(`Asaas webhook received: ${dto.event}`);

    const tenantId = dto.payment?.externalReference || dto.subscription?.externalReference;
    if (!tenantId) return { received: true };

    if (dto.event === 'PAYMENT_CONFIRMED' || dto.event === 'PAYMENT_RECEIVED') {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { blocked: false },
      });
      await this.prisma.invoice.updateMany({
        where: { asaasId: dto.payment?.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }

    if (dto.event === 'PAYMENT_OVERDUE' || dto.event === 'PAYMENT_FAILED') {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { blocked: true },
      });
    }

    return { received: true };
  }

  async getHistory(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
