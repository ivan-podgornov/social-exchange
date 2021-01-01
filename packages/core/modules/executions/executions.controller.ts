import { JwtGuard } from '../auth/jwt.guard';
import { Profile as WithProfile } from '../profiles/profile.decorator';
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
        @WithProfile() profile: Profile,
        @Body() body: ExecutionsCheckerOptions,
    ) {
        return this.executionsService.check(profile, body.dispensesIds)();
    }
}
