import { Module } from '@nestjs/common';
import { BoatsController } from './boats.controller';
import { MarketplaceController } from './marketplace.controller';
import { BoatsService } from './boats.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [BoatsController, MarketplaceController],
  providers: [BoatsService],
  exports: [BoatsService],
})
export class BoatsModule {}
