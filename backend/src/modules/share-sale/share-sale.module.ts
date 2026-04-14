import { Module } from '@nestjs/common';
import { ShareSaleController } from './share-sale.controller';
import { ShareSaleService } from './share-sale.service';

@Module({
  controllers: [ShareSaleController],
  providers: [ShareSaleService],
  exports: [ShareSaleService],
})
export class ShareSaleModule {}
