import { NetworkType } from './network';
import { User } from './user';

export enum OfferStatus {
    active = 'active',
    deleted = 'deleted',
    finish = 'finish',
    pause = 'pause',
};

export enum OfferType {
    likes = 'likes',
    reposts = 'reposts',
    friends = 'friends',
    followers = 'followers',
};

export type Offer<OT extends OfferType = OfferType> = {
    id: number,
    count: number,
    countExecutions: number,
    cover: string,
    link: string,
    networkType: NetworkType,
    owner: User,
    ownerId: number,
    status: OfferStatus,
    type: OT,
};

export type OfferConstructorOptions<OT extends OfferType = OfferType> = {
    count: number,
    link: string,
    networkType: NetworkType,
    type: OT,
};

export type OfferCreatedResult<OT extends OfferType> = {
    price: number,
    offer: Offer<OT>,
};

export type OfferDeletedResult<OT extends OfferType> = {
    compensation: number,
    offer: Offer<OT>,
};
