import { Offer, OfferType } from './offer';

export enum DispenseStatus {
    active = 'active',
    banned = 'banned',
};

export type Dispense<OT extends OfferType = OfferType> = {
    id: number,

    /**
     * Дата истечения срока выдачи. Если отправить задание на проверку, после
     * того как срок выдачи закончится, сердечки не будут выданы.
     */
    expires: Date,
    offer: Offer<OT>,
    reward: number,
    status: DispenseStatus,
    title: string,
};

export type TypedDispenses<OT extends OfferType> = {
    list: Dispense<OT>[],
    reachLimit: boolean,
    type: OT,
};

export type Dispenses = {
    likes: TypedDispenses<OfferType.likes>,
    reposts: TypedDispenses<OfferType.reposts>,
    friends: TypedDispenses<OfferType.friends>,
    followers: TypedDispenses<OfferType.followers>,
};
