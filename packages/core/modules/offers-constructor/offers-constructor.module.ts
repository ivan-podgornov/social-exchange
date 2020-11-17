import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferEntity } from '../offers/offer.entity';
import { OffersCheckerModule } from '../offers-checker/offers-checker.module';
import { InfoResolverModule } from '../info-resolver/info-resolver.module';
import { OffersConstructor } from './offers-constructor';

@Module({
    providers: [OffersConstructor],
    exports: [
        TypeOrmModule,
        OffersConstructor,
    ],
    imports: [
        TypeOrmModule.forFeature([OfferEntity]),
        InfoResolverModule,
        OffersCheckerModule,
    ],
})
export class OffersConstructorModule {};
