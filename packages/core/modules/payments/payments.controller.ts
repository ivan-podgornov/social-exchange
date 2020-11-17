import * as querystring from 'querystring';
import { getOrElseW } from 'fp-ts/Either';
import { PaymentsService } from './payments.service';
import { PaymentCreateRequest, PaymentOptions, UnitpayPayload } from './types';

import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Redirect,
} from '@nestjs/common';

@Controller('payments')
export class PaymentsController {
    constructor(
        private paymentsService: PaymentsService,
    ) {}

    @Get()
    async get(@Query() payload: UnitpayPayload) {
        try {
            const eitherResult = await this.paymentsService.process(payload);
            const result = getOrElseW((error: Error) => error)(eitherResult);
            if (result instanceof Error) throw Error;

            return {
                result: {
                    message: 'Запрос успешно обработан',
                },
            }
        } catch (error) {
            return {
                error: {
                    message: error.message,
                },
            };
        }
    }

    @Post()
    @Redirect()
    async post(@Body() body: PaymentCreateRequest) {
        const options: PaymentOptions = {
            account: body.account,
            currency: 'RUB',
            desc: 'Приобретение баллов на sealikes.com',
            sum: (parseInt(body.count, 10) || 0) / 10,
        };

        const signature = this.paymentsService.signature(options);
        const query = querystring.encode({ ...options, signature });
        const url = `https://unitpay.ru/pay/${process.env.UNITPAY_PUBLICKEY}?${query}`;

        return { url };
    }
}
