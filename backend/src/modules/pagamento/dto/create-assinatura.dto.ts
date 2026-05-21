import { IsString, IsEnum, IsOptional, IsCreditCard, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MetodoPagamento {
  CREDIT_CARD = 'credit_card',
  BOLETO = 'boleto',
  PIX = 'pix',
}

export class CreateAssinaturaDto {
  @ApiProperty({ description: 'Slug do tipo de plano' })
  @IsString()
  planoTipo: string;

  @ApiProperty({ enum: MetodoPagamento, description: 'Método de pagamento' })
  @IsEnum(MetodoPagamento)
  metodo: MetodoPagamento;

  @ApiPropertyOptional({ description: 'Nome no cartão (obrigatório para credit_card)' })
  @IsOptional()
  @IsString()
  cardHolderName?: string;

  @ApiPropertyOptional({ description: 'Número do cartão (obrigatório para credit_card)' })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiPropertyOptional({ description: 'Mês de expiração do cartão' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/)
  cardExpiryMonth?: string;

  @ApiPropertyOptional({ description: 'Ano de expiração do cartão' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/)
  cardExpiryYear?: string;

  @ApiPropertyOptional({ description: 'CCV do cartão' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(4)
  cardCcv?: string;

  @ApiPropertyOptional({ description: 'CEP para cobrança' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Número do endereço para cobrança' })
  @IsOptional()
  @IsString()
  addressNumber?: string;

  @ApiPropertyOptional({ description: 'Token de cartão já tokenizado no Asaas' })
  @IsOptional()
  @IsString()
  creditCardToken?: string;

  @ApiPropertyOptional({ description: 'CPF/CNPJ do pagador' })
  @IsOptional()
  @IsString()
  holderDocument?: string;
}