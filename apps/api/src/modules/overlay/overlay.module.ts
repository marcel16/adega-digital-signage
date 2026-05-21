import { Module } from '@nestjs/common';
import { OverlayController } from './overlay.controller';
import { OverlayService } from './overlay.service';

@Module({
  controllers: [OverlayController],
  providers: [OverlayService],
  exports: [OverlayService],
})
export class OverlayModule {}
