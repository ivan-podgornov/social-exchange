import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Either, isLeft, left, right } from 'fp-ts/Either';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { PaymentEntity, PaymentStatus } from './payment.entity';
import { PaymentOptions, UnitpayPayload } from './types';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(PaymentEntity)
        private payments: Repository<PaymentEntity>,
        private usersService: UsersService,
    ) {}

    async process(payload: UnitpayPayload) {
        const validation = await this.validate(payload);
        if (isLeft(validation)) return validation;

        const ownerId = parseInt(payload.params.account, 10);
        const sum = parseInt(payload.params.orderSum, 10);
        const unitpayId = parseInt(payload.params.unitpayId, 10);
        const found = await this.payments.findOne({ unitpayId });
        if (found && found.status === payload.method) return right(found);

        const payment = found || this.payments.create({
            ownerId,
            sum,
            unitpayId,
            date: payload.params.date,
            error: payload.params.errorMessage,
        });

        const saved = await this.payments.save({
            ...payment,
            status: payload.method,
        });

        if (this.needHearts(payload, found)) {
            await this.usersService.giveHearts(ownerId)(sum * 10);
        }

        return right(saved);
    }

    private async validate(
        payload: UnitpayPayload,
    ): Promise<Either<Error, UnitpayPayload>> {
        const id = parseInt(payload.params.account, 10);
        const user = await this.usersService.findById(id);
        if (isLeft(user)) {
            const message = `Пользователь с id #${id} не найден`;
            return left(new Error(message));
        }

        if (parseInt(payload.params.orderSum, 10) < 10) {
            const message = 'Минимальная сумма платежа - 10Р';
            return left(new Error(message));
        }

        if (payload.params.orderCurrency !== 'RUB') {
            const message = 'Мы принимаем оплату только в рублях';
            return left(new Error(message));
        }

        const signature = this.signature(payload.params, payload.method);
        if (payload.params.signature !== signature) {
            const message = 'Цифровая подпись не совпадает';
            return left(new Error(message));
        }

        return right(payload);
    }

    signature<T extends UnitpayPayload['params']|PaymentOptions>(
        payload: T,
        method?: PaymentStatus,
    ) {
        type ParamsKeys = Array<keyof T>;
        const params = (Object.keys(payload) as ParamsKeys)
            .filter((key) => !['signature', 'sign'].includes(key as string))
            .sort()
            .reduce((secret, key) => {
                const value = payload[key];
                return secret + `${value}{up}`;
            }, '');

        const secret = process.env.UNITPAY_SECRET;
        const methodStr = method ? `${method}{up}` : '';
        const key = `${methodStr}${params}${secret}`;
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    /**
     * Проверяет, нужно ли выдать пользователи сердечки. Первым параметром
     * передаётся платёж, который уже был в базе данных, вторым то что
     * прислал Unitpay.
     */
    private needHearts(payload: UnitpayPayload, payment?: PaymentEntity) {
        if (payment && payment.status === PaymentStatus.pay) return false;
        return payload.method === PaymentStatus.pay;
    }
}
