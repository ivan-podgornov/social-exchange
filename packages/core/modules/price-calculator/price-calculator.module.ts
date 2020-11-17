import { Module } from '@nestjs/common';
import { PriceCalculator } from './price-calculator';

@Module({
    exports: [PriceCalculator],
    providers: [PriceCalculator],
})
export class PriceCalculatorModule {}
