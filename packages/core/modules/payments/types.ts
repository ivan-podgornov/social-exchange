import { PaymentStatus } from './payment.entity';

export type UnitpayPayload = {
    method: PaymentStatus,
    params: {
        /** id пользователя social-exchange */
        account: string,
        date: string,
        errorMessage?: string,
        orderSum: string,
        orderCurrency: 'RUB',
        signature: string,
        /** Номер платежа в unitpay */
        unitpayId: string,
    },
};

export type PaymentCreateRequest = {
    account: string,
    count: string,
};

export type PaymentOptions = {
    account: string,
    currency: 'RUB',
    desc: string,
    sum: number,
};
