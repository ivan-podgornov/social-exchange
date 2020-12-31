import * as T from 'fp-ts/Task';
import { pipe } from 'fp-ts/pipeable';
import { FindConditions, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promiseChain } from 'helpers/promise-chain';
import { DispensesService } from '../dispenses/dispenses.service';
import { EventsService } from '../events/events.service';
import { Execution } from '../executions/execution.entity';
import { OffersConstructor } from '../offers-constructor/offers-constructor';
import { PriceCalculator } from '../price-calculator/price-calculator';
import { UserEntity } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { OfferEntity } from './offer.entity';

import {
    Offer,
    OfferConstructorOptions,
    OfferStatus,
    User,
} from '@social-exchange/types';

import {
    Either,
    chain,
    getOrElseW,
    isLeft,
    left,
    right,
} from 'fp-ts/Either';

@Injectable()
export class OffersService {
    constructor(
        private dispensesService: DispensesService,
        private eventsService: EventsService,
        private offersCreatorService: OffersConstructor,
        private priceCalculator: PriceCalculator,
        private usersService: UsersService,

        @InjectRepository(OfferEntity)
        private offers: Repository<OfferEntity>,
    ) {}

    async create(options: OfferConstructorOptions, owner: User) {
        const offer = await this.offersCreatorService.construct(options, owner);
        type Result = Either<Error, { offer: Offer, price: number }>;
        const afterCreating = async (entity: OfferEntity): Promise<Result> => {
            const offer = this.toJson(entity);
            const price = this.priceCalculator.calculate(offer);
            await this.usersService.takeHearts(owner)(price);
            return right({ offer, price });
        };

        return promiseChain(afterCreating)(offer);
    }

    async get(owner: User) {
        const offers = await this.find({
            ownerId: owner.id,
            status: In([OfferStatus.active, OfferStatus.pause]),
        });

        return offers.map<Offer>(this.toJson.bind(this));
    }

    async findById(offerId: number) {
        const [offer] = await this.find({ id: offerId });
        return offer ? right(offer) : left(null);
    }

    async setStatus(offerId: number, initiator: User, status: OfferStatus) {
        const offerEither = await this.findById(offerId);
        const offer = getOrElseW((left: null) => left)(offerEither);
        if (offer === null) return left('Задание с таким id не найдено');

        const check = pipe(
            this.checkStatus(status),
            chain(this.canChangeStatus.bind(this, initiator, offer)),
        );

        if (isLeft(check)) return check;
        if ([OfferStatus.pause, OfferStatus.deleted].includes(status))
            this.dispensesService.removeOfferDispenses(offer);
        if (status === OfferStatus.deleted) return this.delete(initiator, offer);

        offer.status = status;
        await this.offers.save(offer);
        return right(this.toJson(offer));
    }

    finishIfExecuted(offers: OfferEntity[]) {
        if (!offers.length) return T.of(void 1);

        const markAsFinished = (offer: OfferEntity): OfferEntity => ({
            ...offer,
            finishedAt: new Date(),
            status: OfferStatus.finish,
        });

        const sendExecutedEvent = (offer: OfferEntity) => {
            this.eventsService.emit('offer-executed', {
                details: { offer },
                important: true,
                read: false,
                recipient: offer.owner,
                type: 'offer-executed',
            });
        };

        return pipe(
            offers.map((offer) => offer.id),
            (ids) => T.fromTask(() => this.find({ id: In(ids) })),
            T.map((offers) => offers.filter((offer) => offer.countExecutions >= offer.count)),
            T.map((executed) => executed.map(markAsFinished)),
            T.chain((offers) => T.fromTask(() => this.offers.save(offers))),
            T.map((offers) => offers.forEach(sendExecutedEvent)),
        );
    }

    private async delete(initiator: User, offer: OfferEntity) {
        const count = offer.count - offer.countExecutions;
        const options = { ...offer, count };
        const compensation = this.priceCalculator.calculate(options);
        offer.status = OfferStatus.deleted;

        await Promise.all([
            this.offers.save(offer),
            this.usersService.giveHearts(initiator)(compensation),
        ]);

        return right({
            compensation,
            offer: this.toJson(offer),
        });
    }

    private async find(parameters: FindConditions<OfferEntity>) {
        type RawOffer = OfferEntity & {
            countExecutions: string,
            owner_id: string,
            owner_balance: string,
        };

        const rawOffers: RawOffer[] = await this.offers
            .createQueryBuilder('offer')
            .select('offer.*')
            .addSelect('IFNULL(COUNT(executions.offer_id), 0)', 'countExecutions')
            .leftJoin((qb: SelectQueryBuilder<OfferEntity>) =>
                qb
                    .select('execution.id, execution.offer_id')
                    .from(Execution, 'execution'),
                'executions',
                'offer.id = executions.offer_id',
            )
            .innerJoinAndSelect(UserEntity, 'owner', 'offer.owner_id = owner.id')
            .where(parameters)
            .groupBy('offer.id, executions.offer_id')
            .getRawMany();

        return rawOffers.map<OfferEntity>((raw) => {
            const ownerId = parseInt(raw['owner_id'], 10);
            const offer = this.offers.create(raw);
            offer.countExecutions = parseInt(raw.countExecutions, 10);
            offer.ownerId = ownerId;
            offer.owner = {
                id: ownerId,
                balance: parseInt(raw.owner_balance),
            };

            return offer;
        });
    }

    private checkStatus(status: OfferStatus) {
        const statuses = Object.keys(OfferStatus) as OfferStatus[];
        if (!statuses.includes(status)) {
            const message = 'Неизвестное значение для поля status. '
                + `Допустимые значения: ${statuses.join(', ')}`;
            return left(message);
        }

        return right(status);
    }

    private canChangeStatus(
        initiator: User,
        offer: OfferEntity,
        newStatus: OfferStatus,
    ) {
        const isFinished = offer.status === OfferStatus.finish;
        const owns = offer.ownerId === initiator.id;

        if (isFinished) return left('Задание уже выполнено');
        if (!owns) return left('Задание принадлежит другому пользователю');
        if (newStatus === OfferStatus.finish) {
            return left('Нельзя пометить задание как выполненное');
        }

        return right(newStatus);
    }

    toJson(offer: OfferEntity): Offer {
        const { counter, objectCreated, owner, ownerId, ...result } = offer;
        return result;
    }
};
