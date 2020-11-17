import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsModule } from '../connections/connections.module';
import { EventsModule } from '../events/events.module';
import { Execution } from '../executions/execution.entity';
import { OfferEntity } from '../offers/offer.entity';
import { NetworksModule } from '../networks/networks.module';
import { PriceCalculatorModule } from '../price-calculator/price-calculator.module';
import { TitleResolverModule } from '../title-resolver/title-resolver.module';
import { OffersSearch } from './offers-search';
import { DispensesController } from './dispenses.controller';
import { Dispenser } from './dispenser';
import { DispensesService } from './dispenses.service';
import { DispensesTask } from './dispenses.task';
import { DispenseEntity } from './dispense.entity';

@Module({
    controllers: [DispensesController],
    exports: [
        DispensesService,
        TypeOrmModule,
    ],
    providers: [
        Dispenser,
        DispensesService,
        DispensesTask,
        OffersSearch,
    ],
    imports: [
        ConnectionsModule,
        EventsModule,
        NetworksModule,
        PriceCalculatorModule,
        TitleResolverModule,
        TypeOrmModule.forFeature([
            DispenseEntity,
            Execution,
            OfferEntity,
        ]),
    ],
})
export class DispensesModule {}
