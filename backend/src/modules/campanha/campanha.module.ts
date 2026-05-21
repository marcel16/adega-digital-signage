import { Module } from '@nestjs/common';
import { CampanhaController } from './campanha.controller';
import { CampanhaService } from './campanha.service';

@Module({
  controllers: [CampanhaController],
  providers: [CampanhaService],
  exports: [CampanhaService],
})
export class CampanhaModule {}