import { Module } from '@nestjs/common';
import { AutomationJobs } from './automation.jobs';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { FinanceModule } from '../modules/finance/finance.module';

@Module({
  imports: [NotificationsModule, FinanceModule],
  providers: [AutomationJobs],
})
export class JobsModule {}
