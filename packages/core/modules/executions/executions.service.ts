import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { promiseChain } from 'helpers/promise-chain';
import { DispenseEntity } from '../dispenses/dispense.entity';
import { EventsService } from '../events/events.service';
import { OfferEntity } from '../offers/offer.entity';
import { OffersService } from '../offers/offers.service';
import { PriceCalculator } from '../price-calculator/price-calculator';
import { UsersService } from '../users/users.service';
import { Execution } from './execution.entity';
import { VkExecutionsChecker } from './vk-exeuctions-checker';

import {
    CheckResult,
    ExecutionsCheckResult,
    Profile,
} from '@social-exchange/types';

import {
    Either,
    chain,
    getOrElse,
    left,
    right,
} from 'fp-ts/Either';

@Injectable()
export class ExecutionsService {
    constructor(
        private eventsService: EventsService,
        private offersService: OffersService,
        private priceCalculator: PriceCalculator,
        private usersService: UsersService,
        private vkExecutionsChecker: VkExecutionsChecker,

        @InjectRepository(DispenseEntity)
        private dispenses: Repository<DispenseEntity>,

        @InjectRepository(Execution)
        private executions: Repository<Execution>,

        @InjectRepository(OfferEntity)
        private offers: Repository<OfferEntity>,
    ) {};

    async check(
        profile: Profile,
        dispensesIds: number[],
    ): Promise<Either<Error, ExecutionsCheckResult>> {
        const dispenses = await this.dispenses.findByIds(dispensesIds, {
            relations: ['recipient', 'offer'],
        });

        const checks = dispenses
            .map((dispense) => this.checkDispense(profile, dispense));
        const results = await Promise.all(checks);
        const successDispenses = this.findSuccess(dispenses, results);
        if (successDispenses.length) await this.saveExecutionsFor(profile, successDispenses);

        const successOffersIds = successDispenses.map((dispense) => dispense.offerId);
        const successOffers = successOffersIds.length === 0 ? [] : await this.offers.find({
            relations: ['owner'],
            where: { id: In(successOffersIds) },
        });

        this.offersService.finishIfExecuted(successOffers);
        const deleteTask = successDispenses.length
            ? this.dispenses.delete(successDispenses.map((dispense) => dispense.id))
            : Promise.resolve(1);
        const [reward] = await Promise.all([
            this.giveReward(profile, successDispenses),
            deleteTask as Promise<any>,
        ]);

        if (successOffers.length) this.emitEvents(successOffers, successDispenses);
        return right({ results, reward });
    }

    private async checkDispense(
        profile: Profile,
        dispense: DispenseEntity,
    ): Promise<CheckResult> {
        const validation = this.validateDispense(profile, dispense);
        const onLeft = this.toCheckResult.bind(this, dispense);
        const onRight =
            (status: boolean): Either<Error, CheckResult> => right({
                status,
                dispenseId: dispense.id,
            });

        const checker = (dispense: DispenseEntity) =>
            this.vkExecutionsChecker.check(profile, dispense.offer);
        const status = await promiseChain(checker)(validation);
        const result = chain(onRight)(status);

        return getOrElse(onLeft)(result);
    }

    private async giveReward(profile: Profile, dispenses: DispenseEntity[]) {
        const prices = dispenses.map((dispense) => {
            return this.priceCalculator.calculate({
                ...dispense.offer,
                count: 1,
            });
        });

        const reward = prices.reduce((sum, price) => sum + price, 0);
        const userId = profile.owner.id;
        if (reward) await this.usersService.giveHearts(userId)(reward);

        return reward;
    }

    private validateDispense(
        profile: Profile,
        dispense: DispenseEntity,
    ): Either<Error, DispenseEntity> {
        if (dispense.expires.valueOf() < Date.now()) {
            return left(new Error('Срок действия выдачи истёк'));
        }

        if (dispense.recipientId !== profile.id) {
            return left(new Error(`Для Вас не было выдачи #${dispense.id}`));
        }

        return right(dispense);
    }

    /** Возвращает выдачи, которые выполнены успешно */
    private findSuccess(dispenses: DispenseEntity[], results: CheckResult[]) {
        const findDispense =
            (result: CheckResult) => dispenses.find((dispense) =>
                result.dispenseId === dispense.id) as DispenseEntity;

        return results
            .filter((result) => result.status)
            .map(findDispense);
    }

    private saveExecutionsFor(profile: Profile, dispenses: DispenseEntity[]) {
        if (!dispenses.length) return Promise.resolve([] as Execution[]);

        return this.executions.save(
            dispenses.map((dispense) => this.executions.create({
                date: new Date(),
                offer: { id: dispense.offerId },
                profile: { id: profile.id },
            })),
        );
    }

    private emitEvents(offers: OfferEntity[], dispenses: DispenseEntity[]) {
        offers.forEach((offer) => {
            this.eventsService.emit('execution', {
                details: { offerId: offer.id },
                important: false,
                read: false,
                recipient: offer.owner,
                type: 'execution',
            });
        });

        dispenses.forEach((dispense) => {
            this.eventsService.emit('execution', {
                details: { offerId: dispense.offerId },
                important: false,
                read: false,
                recipient: dispense.recipient,
                type: 'execution',
            });
        });
    }

    private toCheckResult(dispense: DispenseEntity, error: Error): CheckResult {
        return {
            dispenseId: dispense.id,
            error: error.message,
            status: false,
        };
    }
}
