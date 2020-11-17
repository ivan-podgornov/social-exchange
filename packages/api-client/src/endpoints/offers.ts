import type {
    Offer,
    OfferConstructorOptions,
    OfferCreatedResult,
    OfferDeletedResult,
} from '@social-exchange/types';

type TouchOptions = {
    uriParam: number,
};

export type Offers = {
    get(): Array<Offer>,
    post(options: OfferConstructorOptions ): OfferCreatedResult,
    put(options: Partial<Offer> & TouchOptions): Offer,
    delete(options: {} & TouchOptions): OfferDeletedResult,
};
