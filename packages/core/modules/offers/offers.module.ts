import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispensesModule } from '../dispenses/dispenses.module';
import { EventsModule } from '../events/events.module';
import { OffersConstructorModule } from '../offers-constructor/offers-constructor.module';
import { OfferEntity } from './offer.entity';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { PriceCalculatorModule } from '../price-calculator/price-calculator.module';
import { UsersModule } from '../users/users.module';

@Module({
    controllers: [OffersController],
    exports: [TypeOrmModule, OffersService],
    providers: [OffersService],
    imports: [
        DispensesModule,
        EventsModule,
        OffersConstructorModule,
        PriceCalculatorModule,
        TypeOrmModule.forFeature([OfferEntity]),
        UsersModule,
    ],
})
export class OffersModule {};
