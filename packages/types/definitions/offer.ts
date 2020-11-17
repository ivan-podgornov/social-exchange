import { NetworkType } from './network';

export enum OfferStatus {
    active = 'active',
    deleted = 'deleted',
    finish = 'finish',
    pause = 'pause',
};

export enum OfferType {
    likes = 'likes',
    reposts = 'reposts',
    followers = 'followers',
    subscribes = 'subscribes',
};

export type Offer = {
    id: number,
    count: number,
    countExecutions: number,
    cover: string,
    link: string,
    networkType: NetworkType,
    status: OfferStatus,
    type: OfferType,
};

export type OfferConstructorOptions = {
    count: number,
    link: string,
    networkType: NetworkType,
    type: OfferType,
};

export type OfferCreatedResult = {
    price: number,
    offer: Offer,
};

export type OfferDeletedResult = {
    compensation: number,
    offer: Offer,
};
