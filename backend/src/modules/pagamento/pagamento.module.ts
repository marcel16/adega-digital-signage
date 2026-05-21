import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PagamentoController } from './pagamento.controller';
import { PagamentoService } from './pagamento.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [PagamentoController],
  providers: [PagamentoService],
  exports: [PagamentoService],
})
export class PagamentoModule {}