import {
  Controller, Get, Post, Body, Param, Put, Query, UseGuards, HttpCode, HttpStatus, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PagamentoService } from './pagamento.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';
import { CreatePlanoDto } from './dto/create-plano.dto';
import { UpdatePlanoDto } from './dto/update-plano.dto';
import { WebhookDto } from './dto/webhook.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Pagamentos')
@Controller('pagamentos')
export class PagamentoController {
  constructor(private pagamentoService: PagamentoService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar pagamentos do tenant' })
  listPayments(@Query() filters: PaginationDto, @TenantId() tenantId: string) {
    return this.pagamentoService.listPayments(tenantId, filters);
  }

  @Get('planos')
  @Public()
  @ApiOperation({ summary: 'Listar planos disponíveis (público)' })
  getPlanos(@Query('status') status?: string) {
    return this.pagamentoService.getPlanos({ status });
  }

  @Post('assinar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar assinatura para o tenant' })
  @HttpCode(HttpStatus.OK)
  assinar(
    @Body() dto: CreateAssinaturaDto,
    @CurrentUser() user: any,
    @TenantId() tenantId: string,
  ) {
    const tenant = { id: tenantId, ...user?.tenant };
    return this.pagamentoService.createSubscription(tenant, dto);
  }

  @Post('cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar assinatura do tenant' })
  @HttpCode(HttpStatus.OK)
  cancelar(@TenantId() tenantId: string) {
    return this.pagamentoService.cancelSubscriptionByTenant(tenantId);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter assinatura do tenant logado' })
  getSubscription(@TenantId() tenantId: string) {
    return this.pagamentoService.getSubscriptionByTenant(tenantId);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Asaas (público)' })
  webhook(@Body() dto: WebhookDto) {
    return this.pagamentoService.handleWebhook(dto);
  }

  @Post('planos/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar plano (admin)' })
  createPlano(@Body() dto: CreatePlanoDto) {
    return this.pagamentoService.createPlano(dto);
  }

  @Put('planos/admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar plano (admin)' })
  updatePlano(@Param('id') id: string, @Body() dto: UpdatePlanoDto) {
    return this.pagamentoService.updatePlano(id, dto);
  }
}