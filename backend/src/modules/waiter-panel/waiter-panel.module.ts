import { Module } from '@nestjs/common';
import { WaiterPanelController } from './waiter-panel.controller';
import { WaiterPanelService } from './waiter-panel.service';

@Module({
  controllers: [WaiterPanelController],
  providers: [WaiterPanelService],
})
export class WaiterPanelModule {}
