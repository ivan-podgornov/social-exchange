import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispensesModule } from '../dispenses/dispenses.module';
import { EventsModule } from '../events/events.module';
import { OffersModule } from '../offers/offers.module';
import { PriceCalculatorModule } from '../price-calculator/price-calculator.module';
import { UsersModule } from '../users/users.module';
import { VkModule } from '../vk/vk.module';
import { ExecutionsController } from './executions.controller';
import { Execution } from './execution.entity';
import { ExecutionsService } from './executions.service';
import { VkExecutionsChecker } from './vk-exeuctions-checker';

@Module({
    controllers: [ExecutionsController],
    providers: [ExecutionsService, VkExecutionsChecker],
    imports: [
        TypeOrmModule.forFeature([Execution]),
        DispensesModule,
        EventsModule,
        OffersModule,
        PriceCalculatorModule,
        UsersModule,
        VkModule,
    ],
})
export class ExecutionsModule {}
