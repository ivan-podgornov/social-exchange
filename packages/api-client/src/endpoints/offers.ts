import type {
    Offer,
    OfferConstructorOptions,
    OfferCreatedResult,
    OfferDeletedResult,
    OfferType,
} from '@social-exchange/types';

type TouchOptions = {
    uriParam: number,
};

export type Offers = {
    get(): Array<Offer>,
    post<OT extends OfferType>(options: OfferConstructorOptions<OT>): OfferCreatedResult<OT>,
    put(options: Partial<Offer> & TouchOptions): Offer,
    delete(options: {} & TouchOptions): OfferDeletedResult<OfferType>,
};
