import type { Dispenses } from './dispenses';
import type { Offer } from './offer';
import type { Profile } from './profile';
import type { User } from './user';

type Events = {
    'execution': { offerId: number },
    'dispenses': Dispenses,
    'invalidate-dispense': { dispenseId: number },
    'offer-executed': { offer: Offer },
}

export type EventTypes = keyof Events;
export type ExchangeEvent<T extends EventTypes> = {
    /**
     * Если true, сохранит событие в базу данных и потом выдаст при подключении.
     * Если false, просто выдаст получателю.
     */
    important: boolean,

    /** Тип события */
    type: T,

    /** Дополнительная информация о событии */
    details: Events[T],

    /** Было ли уведомление просмотрено */
    read: boolean,

    /**
     * Получатель задания. Получателем может быть как пользователь, так и
     * отдельный профиль пользователя. Если указано число, считается что
     * это id пользователя (User'a)
     */
    recipient: Profile|User|number,
}

// PublicExchangeEvent можно отправить пользователю
export type PublicExchangeEvent<T extends EventTypes>
    = Omit<ExchangeEvent<T>, 'recipient'|'important'> & {
        id: number,
    };

export interface EventListener<T extends EventTypes> {
    (event: PublicExchangeEvent<T>): any,
};
