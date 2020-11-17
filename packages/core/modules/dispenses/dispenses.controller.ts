import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { Network as WithNetwork } from '../networks/network.decorator';
import { Network } from '../networks/network.entity';
import { Dispenser } from './dispenser';

@Controller('dispenses')
@UseGuards(JwtGuard)
export class DispensesController {
    constructor(
        private dispenser: Dispenser,
    ) {}

    @Get()
    get(@WithNetwork() recipient: Network) {
        return this.dispenser.dispense(recipient);
    }
}
