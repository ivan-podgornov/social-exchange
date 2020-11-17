import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { pipe } from 'fp-ts/lib/pipeable';
import { promiseChain } from 'helpers/promise-either';
import { setProperty } from 'helpers/set-property';
import { InfoResolver } from '../info-resolver/info-resolver';
import { OfferEntity } from '../offers/offer.entity';
import { OffersChecker } from '../offers-checker/offers-checker';
import { CheckerOptions } from '../offers-checker/checker-options';
import { Resource } from '../vk/resource';
import {
    OfferConstructorOptions,
    OfferStatus,
    User,
} from '@social-exchange/types';

import {
    Either,
    chain,
    isLeft,
    right,
} from 'fp-ts/Either';

type PreparedOffer = Omit<OfferEntity, 'id'|'owner'>;
type PrepareOptions = {
    offer: OfferConstructorOptions,
    owner: User,
    resource: Resource,
};

@Injectable()
export class OffersConstructor {
    constructor(
        @InjectRepository(OfferEntity)
        private offers: Repository<OfferEntity>,

        private infoResolver: InfoResolver,
        private offersCheckerService: OffersChecker,
    ) {}

    async construct(options: OfferConstructorOptions, owner: User) {
        const checkerOptions = new CheckerOptions(options, owner);
        const resource = await this.offersCheckerService.check(checkerOptions);
        if (isLeft(resource)) return resource;

        const prepareOptions = pipe(
            { offer: options, owner },
            setProperty('resource', resource),
        );

        const prepared = await promiseChain
            (this.prepare.bind(this))(prepareOptions);
        const creator = async (prepared: PreparedOffer) => {
            const offer = this.offers.create({ ...prepared });
            await this.offers.save(offer);
            offer.countExecutions = 0;
            return right(offer) as Either<Error, OfferEntity>;
        };

        const offer = await promiseChain(creator)(prepared);
        return offer;
    }

    /** Готовит информацию об оффере */
    private async prepare(options: PrepareOptions) {
        const { offer, owner, resource } = options;
        const [cover, counter, created] =
            await this.infoResolver.resolve(resource, offer.type);

        const target = {
            ownerId: owner.id,
            count: offer.count,
            createdAt: new Date(),
            finishedAt: null,
            link: resource.toString(),
            networkType: offer.networkType,
            status: OfferStatus.active,
            type: offer.type,
        };

        return pipe(
            setProperty('cover', cover)(target),
            chain(setProperty('counter', counter)),
            chain(setProperty('objectCreated', created)),
        ) as Either<Error, PreparedOffer>;
    }
};
