import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository, Raw } from 'typeorm';
import { Execution } from '../executions/execution.entity';
import { OfferEntity } from '../offers/offer.entity';
import { PriceCalculator } from '../price-calculator/price-calculator';
import { TitleResolver } from '../title-resolver/title-resolver.service';
import { OffersSearch } from './offers-search';
import { DispenseEntity } from './dispense.entity';

import {
    Dispense,
    TypedDispenses,
    DispenseStatus,
    NetworkType,
    OfferType,
    Profile,
} from '@social-exchange/types';

export type DispenseOptions<OT extends OfferType> = {
    networkType: NetworkType,
    offerType: OT,
    recipientId: number,
    userId: number,
};

@Injectable()
export class Dispenser {
    constructor(
        private offersSearch: OffersSearch,
        private priceCalculator: PriceCalculator,
        private titleResolve: TitleResolver,

        @InjectRepository(DispenseEntity)
        private dispenses: Repository<DispenseEntity>,

        @InjectRepository(Execution)
        private executions: Repository<Execution>,

        @InjectRepository(OfferEntity)
        private offers: Repository<OfferEntity<OfferType>>,
    ) {}

    async dispense(profile: Profile) {
        const options: Omit<DispenseOptions<OfferType>, 'offerType'> = {
            networkType: profile.type,
            recipientId: profile.id,
            userId: profile.ownerId,
        };

        const [likes, reposts, friends, followers] = await Promise.all([
            this.getDispenses({ ...options, offerType: OfferType.likes }),
            this.getDispenses({ ...options, offerType: OfferType.reposts }),
            this.getDispenses({ ...options, offerType: OfferType.friends }),
            this.getDispenses({ ...options, offerType: OfferType.followers }),
        ]);

        return { likes, reposts, friends, followers };
    }

    /**
     * Возвращает список выдач определённого типа. Если лимиты позволяют, кроме
     * уже выданных заданий, выдаст ещё заданий.
     */
    private async getDispenses<OT extends OfferType>(
        options: DispenseOptions<OT>,
    ): Promise<TypedDispenses<OT>> {
        const [dispenses, executions] = await Promise.all([
            this.getProfileDispenses(options),
            this.getLastExecutions(options),
        ]);

        const limit = this.calculateLimit(dispenses, executions);
        const rawOffers = await this.offersSearch.search(options, limit);
        const offers = rawOffers.map((raw) => this.offers.create(raw) as OfferEntity<OT>);
        const newDispenses = await this.dispenses.save(
            offers.map<DispenseEntity<OT>>((offer) => this.dispenses.create({
                offer,
                expires: new Date(Date.now() + 3.6e+6), // 3.6e+6 - час
                recipient: { id: options.recipientId },
                status: DispenseStatus.active,
            }) as DispenseEntity<OT>),
        ) as Array<DispenseEntity<OT>>;

        const allDispenses = dispenses.concat(newDispenses);
        const populated = allDispenses
            .map((dispense) => this.populateDispenseEntity(dispense));

        return {
            list: await Promise.all(populated),
            type: options.offerType,
            reachLimit: limit <= 0,
        };
    }

    /** Определяет какой должен быть заголовок у выдачи и награду за неё */
    private async populateDispenseEntity<OT extends OfferType>(
        dispense: DispenseEntity<OT>,
    ): Promise<Dispense<OT>> {
        const title = await this.titleResolve.resolve(dispense.offer);
        const reward = this.priceCalculator.calculate({ ...dispense.offer, count: 1 });
        return { ...dispense, title, reward };
    }

    /** Рассчитывает сколько ещё заданий указанного типа можно выдать */
    private calculateLimit(dispenses: DispenseEntity[], executions: Execution[]) {
        const dayLimit = 30;
        const total = dispenses.length + executions.length;
        const limit = Math.min(dayLimit - total, 5 - dispenses.length);
        return Math.max(limit, 0);
    }

    /**
     * Возвращает выполнения пользователя, которые
     * были сделаны за последние 24 часа
     */
    private getLastExecutions(options: DispenseOptions<OfferType>) {
        const dateCondition = ''
            + 'YEAR(CURRENT_TIMESTAMP) = YEAR(date) AND '
            + 'DAYOFYEAR(CURRENT_TIMESTAMP) - DAYOFYEAR(date) <= 1 AND '
            + '(((DAYOFYEAR(CURRENT_TIMESTAMP) - DAYOFYEAR(date)) * 24) '
            +     '+ HOUR(CURRENT_TIMESTAMP) - HOUR(date)) < 24';

        return this.executions.find({
            relations: ['offer'],
            where: {
                date: Raw(dateCondition),
                profile: { id: options.recipientId },
                offer: {
                    id: MoreThan(0),
                    networkType: options.networkType,
                    type: options.offerType,
                },
            },
        });
    }

    /** Возвращает список уже выданных пользователю заданий */
    private async getProfileDispenses<OT extends OfferType>(
        options: DispenseOptions<OT>,
    ) {
        const dispenses = await this.dispenses.find({
            relations: ['offer'],
            where: {
                expires: MoreThan(new Date()),
                recipient: { id: options.recipientId },
                status: DispenseStatus.active,
            },
        });

        return dispenses.filter((dispense): dispense is DispenseEntity<OT> => {
            return dispense.offer.networkType === options.networkType
                && dispense.offer.type === options.offerType;
        });
    }
}
