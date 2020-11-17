import { Module } from '@nestjs/common';
import { PriceCalculatorModule } from '../price-calculator/price-calculator.module';
import { VkModule } from '../vk/vk.module';
import { OffersChecker } from './offers-checker';
import { VkOffersChecker } from './vk/vk-offers-checker';

@Module({
    exports: [OffersChecker],
    imports: [PriceCalculatorModule, VkModule],
    providers: [
        OffersChecker,
        VkOffersChecker,
    ],
})
export class OffersCheckerModule {};
