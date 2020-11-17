import { left } from 'fp-ts/Either';
import { JwtGuard } from '../auth/jwt.guard';
import { OffersService } from './offers.service';
import { User as WithUser } from '../users/user.decorator';

import {
    Offer,
    OfferConstructorOptions,
    OfferStatus,
    User,
} from '@social-exchange/types';

import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';

@Controller('offers')
@UseGuards(JwtGuard)
export class OffersController {
    constructor(
        private offersService: OffersService,
    ) {}

    @Get()
    dispense(@WithUser() user: User) {
        return this.offersService.get(user);
    }

    @Post()
    create(
        @Body() options: OfferConstructorOptions,
        @WithUser() owner: User,
    ) {
        return this.offersService.create(options, owner);
    }

    @Put(':id')
    update(
        @Body() options: Partial<Offer>,
        @Param('id') rawOfferId: string,
        @WithUser() initiator: User,
        method: 'put'|'delete' = 'put',
    ) {
        const { status } = options;
        if (!status) return left('Поменять можно только статус задания');
        if (method !== 'delete' && status === OfferStatus.deleted) {
            return left('Для удаления используйте http-метод DELETE');
        }

        const offerId = parseInt(rawOfferId);
        if (isNaN(offerId)) return left('id оффера должен быть числом');

        return this.offersService.setStatus(offerId, initiator, status);
    }

    @Delete(':id')
    delete(
        @Param('id') rawOfferId: string,
        @WithUser() initiator: User,
    ) {
        const options = { status: OfferStatus.deleted };
        return this.update(options, rawOfferId, initiator, 'delete');
    }
}
