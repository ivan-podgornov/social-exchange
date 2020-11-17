import { JwtGuard } from '../auth/jwt.guard';
import { Network as WithNetwork } from '../networks/network.decorator';
import { ExecutionsService } from './executions.service';

import {
    ExecutionsCheckerOptions,
    Profile,
} from '@social-exchange/types';

import {
    Body,
    Controller,
    Post,
    UseGuards,
} from '@nestjs/common';

@Controller('executions')
@UseGuards(JwtGuard)
export class ExecutionsController {
    constructor(private executionsService: ExecutionsService) {}

    @Post()
    check(
        @WithNetwork() network: Profile,
        @Body() body: ExecutionsCheckerOptions,
    ) {
        return this.executionsService.check(network, body.dispensesIds);
    }
}
