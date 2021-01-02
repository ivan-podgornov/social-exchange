import { Controller, Get, UseGuards } from '@nestjs/common';
import { Profile } from '@social-exchange/types';
import { JwtGuard } from '../auth/jwt.guard';
import { Profile as WithProfile } from '../profiles/profile.decorator';
import { Dispenser } from './dispenser';

@Controller('dispenses')
@UseGuards(JwtGuard)
export class DispensesController {
    constructor(
        private dispenser: Dispenser,
    ) {}

    @Get()
    get(@WithProfile() recipient: Profile) {
        return this.dispenser.dispense(recipient);
    }
}
