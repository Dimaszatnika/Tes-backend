import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderController } from './order/order.controller';
import { OrderWorkerService } from './order-worker/order-worker.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController, OrderController],
  providers: [AppService, OrderWorkerService],
})
export class AppModule {}
