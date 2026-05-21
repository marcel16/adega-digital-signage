import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateAssinaturaDto, MetodoPagamento } from './dto/create-assinatura.dto';
import { CreatePlanoDto } from './dto/create-plano.dto';
import { UpdatePlanoDto } from './dto/update-plano.dto';
import { firstValueFrom } from 'rxjs';
import { Prisma } from '@prisma/client';

interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
}

interface AsaasSubscriptionData {
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone?: string;
  };
  creditCardToken?: string;
  externalReference?: string;
}

const ASAAS_API_URL = 'https://api.asaas.com/v3';
const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';

@Injectable()
export class PagamentoService {
  private readonly logger = new Logger(PagamentoService.name);
  private readonly asaasUrl: string;
  private readonly asaasKey: string;
  private readonly headers: Record<string, string>;

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {
    const sandbox = process.env.ASAAS_SANDBOX === 'true';
    this.asaasUrl = sandbox ? ASAAS_SANDBOX_URL : ASAAS_API_URL;
    this.asaasKey = sandbox
      ? process.env.ASAAS_SANDBOX_KEY || ''
      : process.env.ASAAS_API_KEY || '';
    this.headers = {
      'Content-Type': 'application/json',
      'access_token': this.asaasKey,
    };
  }

  async createCustomer(tenant: any): Promise<string> {
    try {
      const payload: AsaasCustomerData = {
        name: tenant.nome,
        email: tenant.email || `${tenant.slug}@adegasignage.com.br`,
        cpfCnpj: tenant.documento || undefined,
        phone: tenant.telefone || undefined,
      };

      const { data } = await firstValueFrom(
        this.httpService.post(`${this.asaasUrl}/customers`, payload, { headers: this.headers }),
      );

      this.logger.log(`Cliente Asaas criado: ${data.id} para tenant ${tenant.id}`);
      return data.id;
    } catch (error: any) {
      const msg = error.response?.data?.errors?.[0]?.description || error.message;
      this.logger.error(`Erro ao criar customer Asaas: ${msg}`);
      throw new BadRequestException(`Erro Asaas: ${msg}`);
    }
  }

  async createSubscription(tenant: any, dto: CreateAssinaturaDto) {
    const plano = await this.prisma.plano.findUnique({ where: { slug: dto.planoTipo } });
    if (!plano || plano.status !== 'active') {
      throw new NotFoundException('Plano não encontrado ou indisponível');
    }

    const assinaturaExistente = await this.prisma.assinatura.findUnique({
      where: { tenantId: tenant.id },
    });

    if (assinaturaExistente && assinaturaExistente.status === 'active') {
      throw new BadRequestException('Tenant já possui assinatura ativa');
    }

    let asaasCustomerId = assinaturaExistente?.asaasId;
    if (!asaasCustomerId) {
      asaasCustomerId = await this.createCustomer(tenant);
    }

    const nextDueDate = this.getNextDueDate(dto.metodo);
    const billingType = this.mapBillingType(dto.metodo);

    const subscriptionPayload: AsaasSubscriptionData = {
      customer: asaasCustomerId,
      billingType,
      value: Number(plano.valor),
      nextDueDate,
      cycle: plano.ciclo,
      description: `Assinatura plano ${plano.nome}`,
      externalReference: tenant.id,
    };

    if (dto.metodo === MetodoPagamento.CREDIT_CARD) {
      if (dto.creditCardToken) {
        subscriptionPayload.creditCardToken = dto.creditCardToken;
      } else if (dto.cardNumber) {
        subscriptionPayload.creditCard = {
          holderName: dto.cardHolderName || '',
          number: dto.cardNumber,
          expiryMonth: dto.cardExpiryMonth || '',
          expiryYear: dto.cardExpiryYear || '',
          ccv: dto.cardCcv || '',
        };
      }

      if (!subscriptionPayload.creditCardToken && !subscriptionPayload.creditCard) {
        throw new BadRequestException('Dados de cartão de crédito ou token são obrigatórios para credit_card');
      }

      subscriptionPayload.creditCardHolderInfo = {
        name: tenant.nome,
        email: tenant.email || `${tenant.slug}@adegasignage.com.br`,
        cpfCnpj: dto.holderDocument || tenant.documento || '',
        postalCode: dto.postalCode || '',
        addressNumber: dto.addressNumber || '',
        phone: tenant.telefone || '',
      };
    }

    try {
      const { data: subscription } = await firstValueFrom(
        this.httpService.post(`${this.asaasUrl}/subscriptions`, subscriptionPayload, { headers: this.headers }),
      );

      const assinatura = await this.prisma.assinatura.upsert({
        where: { tenantId: tenant.id },
        create: {
          tenantId: tenant.id,
          asaasId: subscription.id,
          planoTipo: dto.planoTipo,
          status: 'active',
          valor: plano.valor,
          ciclo: plano.ciclo,
          dataInicio: new Date(),
        },
        update: {
          asaasId: subscription.id,
          planoTipo: dto.planoTipo,
          status: 'active',
          valor: plano.valor,
          ciclo: plano.ciclo,
          dataInicio: new Date(),
          canceladoEm: null,
        },
      });

      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          planoTipo: plano.slug,
          maxEstabelecimentos: plano.maxEstabelecimentos,
          maxTvs: plano.maxTvs,
          maxMidias: plano.maxMidias,
          maxArmazenamentoMb: plano.maxArmazenamentoMb,
          status: 'active',
        },
      });

      await this.prisma.fatura.create({
        data: {
          assinaturaId: assinatura.id,
          asaasId: subscription.id,
          valor: plano.valor,
          status: 'pending',
          dataVencimento: new Date(subscription.nextDueDate || nextDueDate),
          urlBoleto: subscription.bankSlipUrl || null,
          urlPix: subscription.pixQrCodeUrl || null,
          linhaDigitable: subscription.identificationField || null,
          cicloReferencia: this.getCurrentReference(),
        },
      });

      this.logger.log(`Assinatura criada: ${subscription.id} para tenant ${tenant.id}`);

      return {
        assinatura,
        paymentUrl: subscription.invoiceUrl || subscription.bankSlipUrl || subscription.pixQrCodeUrl || null,
        pixCopiaECola: subscription.pixCopiaECola || null,
        boletoUrl: subscription.bankSlipUrl || null,
      };
    } catch (error: any) {
      const msg = error.response?.data?.errors?.[0]?.description || error.message;
      this.logger.error(`Erro ao criar assinatura Asaas: ${msg}`);
      throw new BadRequestException(`Erro Asaas: ${msg}`);
    }
  }

  async getSubscriptionStatus(asaasSubscriptionId: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.asaasUrl}/subscriptions/${asaasSubscriptionId}`, { headers: this.headers }),
      );

      const assinatura = await this.prisma.assinatura.findFirst({
        where: { asaasId: asaasSubscriptionId },
      });

      if (assinatura && data.status !== assinatura.status) {
        const statusMap: Record<string, any> = {
          ACTIVE: 'active',
          INACTIVE: 'inactive',
          EXPIRED: 'canceled',
          DELETED: 'canceled',
        };
        const mappedStatus = statusMap[data.status] || assinatura.status;
        await this.prisma.assinatura.update({
          where: { id: assinatura.id },
          data: { status: mappedStatus },
        });
      }

      return data;
    } catch (error: any) {
      const msg = error.response?.data?.errors?.[0]?.description || error.message;
      this.logger.error(`Erro ao obter status assinatura Asaas: ${msg}`);
      throw new BadRequestException(`Erro Asaas: ${msg}`);
    }
  }

  async cancelSubscription(asaasSubscriptionId: string) {
    const assinatura = await this.prisma.assinatura.findFirst({
      where: { asaasId: asaasSubscriptionId },
    });
    if (!assinatura) throw new NotFoundException('Assinatura não encontrada');

    try {
      await firstValueFrom(
        this.httpService.delete(`${this.asaasUrl}/subscriptions/${asaasSubscriptionId}`, { headers: this.headers }),
      );
    } catch (error: any) {
      this.logger.warn(`Falha ao cancelar no Asaas (pode já estar cancelada): ${error.message}`);
    }

    const updated = await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: {
        status: 'canceled',
        canceladoEm: new Date(),
        dataFim: new Date(),
      },
    });

    await this.prisma.tenant.update({
      where: { id: assinatura.tenantId },
      data: { status: 'canceled' },
    });

    return updated;
  }

  async cancelSubscriptionByTenant(tenantId: string) {
    const assinatura = await this.prisma.assinatura.findUnique({
      where: { tenantId },
    });
    if (!assinatura) throw new NotFoundException('Assinatura não encontrada');
    if (assinatura.asaasId) {
      return this.cancelSubscription(assinatura.asaasId);
    }
    const updated = await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { status: 'canceled', canceladoEm: new Date(), dataFim: new Date() },
    });
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'canceled' },
    });
    return updated;
  }

  async listPayments(tenantId: string, filters: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const where: Prisma.PagamentoWhereInput = { tenantId };

    const [data, total] = await Promise.all([
      this.prisma.pagamento.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.pagamento.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async getPlanos(filters?: { status?: string }) {
    const where: Prisma.PlanoWhereInput = {};
    if (filters?.status) {
      where.status = filters.status as any;
    }
    return this.prisma.plano.findMany({
      where,
      orderBy: { ordem: 'asc' },
    });
  }

  async createPlano(dto: CreatePlanoDto) {
    const existing = await this.prisma.plano.findFirst({
      where: {
        OR: [{ slug: dto.slug }, { nome: dto.nome }],
      },
    });
    if (existing) throw new BadRequestException('Slug ou nome já em uso');

    return this.prisma.plano.create({
      data: {
        nome: dto.nome,
        slug: dto.slug,
        descricao: dto.descricao,
        valor: dto.valor,
        ciclo: dto.ciclo,
        maxEstabelecimentos: dto.maxEstabelecimentos,
        maxTvs: dto.maxTvs,
        maxMidias: dto.maxMidias,
        maxArmazenamentoMb: dto.maxArmazenamentoMb,
        recursos: dto.recursos,
        ordem: dto.ordem,
        destaque: dto.destaque,
      },
    });
  }

  async updatePlano(id: string, dto: UpdatePlanoDto) {
    const plano = await this.prisma.plano.findUnique({ where: { id } });
    if (!plano) throw new NotFoundException('Plano não encontrado');

    if (dto.slug || dto.nome) {
      const conflicting = await this.prisma.plano.findFirst({
        where: {
          OR: [
            ...(dto.slug ? [{ slug: dto.slug }] : []),
            ...(dto.nome ? [{ nome: dto.nome }] : []),
          ],
          id: { not: id },
        },
      });
      if (conflicting) throw new BadRequestException('Slug ou nome já em uso');
    }

    return this.prisma.plano.update({
      where: { id },
      data: dto,
    });
  }

  async createFatura(assinaturaId: string, data: { valor: number; dataVencimento: string; cicloReferencia?: string }) {
    const assinatura = await this.prisma.assinatura.findUnique({ where: { id: assinaturaId } });
    if (!assinatura) throw new NotFoundException('Assinatura não encontrada');

    return this.prisma.fatura.create({
      data: {
        assinaturaId,
        valor: data.valor,
        status: 'pending',
        dataVencimento: new Date(data.dataVencimento),
        cicloReferencia: data.cicloReferencia,
      },
    });
  }

  async getSubscriptionByTenant(tenantId: string) {
    const assinatura = await this.prisma.assinatura.findUnique({
      where: { tenantId },
      include: {
        faturas: {
          orderBy: { dataVencimento: 'desc' },
          take: 12,
        },
      },
    });

    if (!assinatura) return null;

    let asaasData = null;
    if (assinatura.asaasId) {
      try {
        asaasData = await this.getSubscriptionStatus(assinatura.asaasId);
      } catch {
        this.logger.warn(`Falha ao buscar dados Asaas para assinatura ${assinatura.asaasId}`);
      }
    }

    return { ...assinatura, asaasData };
  }

  async handleWebhook(payload: { event: string; payment: any; subscription?: any }) {
    this.logger.log(`Webhook Asaas recebido: ${payload.event}`);

    const { event, payment } = payload;

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      await this.handlePaymentConfirmed(payment);
    } else if (event === 'PAYMENT_OVERDUE') {
      await this.handlePaymentOverdue(payment);
    } else if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
      await this.handlePaymentCanceled(payment);
    } else if (event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_EXPIRED') {
      await this.handleSubscriptionCanceled(payload.subscription || payment);
    }

    return { received: true, event };
  }

  private async handlePaymentConfirmed(payment: any) {
    const paymentId = payment.id || payment.asaasId;
    const faturas = await this.prisma.fatura.findMany({
      where: {
        OR: [{ asaasId: paymentId }, { asaasInvoiceId: paymentId }],
      },
    });

    if (faturas.length === 0) {
      await this.prisma.pagamento.create({
        data: {
          tenantId: payment.externalReference || 'unknown',
          asaasId: payment.id,
          asaasPaymentId: payment.id,
          valor: payment.value || payment.netValue || 0,
          taxa: 0,
          status: 'confirmed',
          metodo: payment.billingType || 'UNKNOWN',
          descricao: payment.description || '',
          metadata: payment,
          dataPagamento: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
          pixCopiaECola: payment.pixCopiaECola || null,
          boletoUrl: payment.bankSlipUrl || null,
          cardLastDigits: payment.creditCard?.creditCardNumber?.slice?.(-4) || null,
        },
      });
      return;
    }

    for (const fatura of faturas) {
      await this.prisma.fatura.update({
        where: { id: fatura.id },
        data: {
          status: 'paid',
          dataPagamento: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
        },
      });
    }
  }

  private async handlePaymentOverdue(payment: any) {
    const paymentId = payment.id || payment.asaasId;
    await this.prisma.fatura.updateMany({
      where: {
        OR: [{ asaasId: paymentId }, { asaasInvoiceId: paymentId }],
      },
      data: { status: 'overdue' },
    });
  }

  private async handlePaymentCanceled(payment: any) {
    const paymentId = payment.id || payment.asaasId;
    await this.prisma.fatura.updateMany({
      where: {
        OR: [{ asaasId: paymentId }, { asaasInvoiceId: paymentId }],
      },
      data: { status: 'canceled' },
    });
  }

  private async handleSubscriptionCanceled(subscription: any) {
    const subId = subscription.id || subscription.asaasId;
    const assinatura = await this.prisma.assinatura.findFirst({
      where: { asaasId: subId },
    });
    if (assinatura) {
      await this.prisma.assinatura.update({
        where: { id: assinatura.id },
        data: { status: 'canceled', canceladoEm: new Date() },
      });
      await this.prisma.tenant.update({
        where: { id: assinatura.tenantId },
        data: { status: 'canceled' },
      });
    }
  }

  private getNextDueDate(metodo: MetodoPagamento): string {
    const date = new Date();
    if (metodo === MetodoPagamento.BOLETO) {
      date.setDate(date.getDate() + 3);
    } else if (metodo === MetodoPagamento.CREDIT_CARD) {
      date.setDate(date.getDate() + 1);
    } else {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
  }

  private getCurrentReference(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private mapBillingType(metodo: MetodoPagamento): string {
    switch (metodo) {
      case MetodoPagamento.CREDIT_CARD:
        return 'CREDIT_CARD';
      case MetodoPagamento.BOLETO:
        return 'BOLETO';
      case MetodoPagamento.PIX:
        return 'PIX';
      default:
        return 'UNDEFINED';
    }
  }
}