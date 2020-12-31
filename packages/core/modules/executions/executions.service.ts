import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { array } from 'fp-ts/Array';
import { pipe } from 'fp-ts/pipeable';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CheckResult, Profile } from '@social-exchange/types';
import { Repository } from 'typeorm';
import { DispenseEntity } from '../dispenses/dispense.entity';
import { EventsService } from '../events/events.service';
import { OffersService } from '../offers/offers.service';
import { PriceCalculator } from '../price-calculator/price-calculator';
import { UsersService } from '../users/users.service';
import { Execution } from './execution.entity';
import { VkExecutionsChecker } from './vk-exeuctions-checker';

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
    ) {};

    check(profile: Profile, dispensesIds: number[]) {
        const findOptions = { relations: ['recipient', 'offer'] };
        type FullCheckResult = CheckResult & { dispense: DispenseEntity };
        const omitDispense = (resultWithDispense: FullCheckResult): CheckResult => {
            const { dispense, ...result } = resultWithDispense;
            return result;
        };

        const deleteDispenses = (dispensesIds: number[]): T.Task<void> => {
            if (!dispensesIds.length) return T.of(void 1);
            return pipe(
                T.fromTask(() => this.dispenses.delete(dispensesIds)),
                T.map(() => void 1),
            );
        };

        return pipe(
            T.fromTask(() => this.dispenses.findByIds(dispensesIds, findOptions)),
            T.chain((dispenses) => pipe(
                array.map(dispenses, (dispense) => this.checkDispense(profile, dispense)),
                array.sequence(T.task),
            )),
            T.chain((results) => pipe(
                T.of(results.filter((result) => result.status).map((result) => result.dispense)),
                // Сохраняются выполнения для успешных выдач
                T.chainFirst((success) => this.saveExecutionsFor(profile, success)),
                // Выполненные офферы помечаются как выполненные
                T.chainFirst((success) => pipe(
                    success.map((dispense) => dispense.offer),
                    (offers) => this.offersService.finishIfExecuted(offers),
                )),
                // Удаляются выдачи выполненных офферов
                T.chainFirst((success) => pipe(
                    T.of(success.map((dispense) => dispense.id)),
                    T.chain((ids) => deleteDispenses(ids)),
                )),
                // Отправляет события о выполнениях
                T.chainFirst((success) => T.of(this.emitEvents(success))),
                // Выдаётся награда за выполненные офферы
                T.chain((success) => this.giveReward(profile, success)),
                T.map((reward) => ({ results: results.map(omitDispense), reward })),
            )),
        );
    }

    private checkDispense(profile: Profile, dispense: DispenseEntity) {
        const checker = this.vkExecutionsChecker;
        return pipe(
            this.validateDispense(profile, dispense),
            TE.chain((dispense) => TE.fromTask(checker.check(profile, dispense.offer))),
            TE.fold<Error, boolean, CheckResult & { dispense: DispenseEntity }>(
                (error: Error) => T.of({ ...this.toCheckResult(dispense, error), dispense }),
                (status: boolean) => T.of({ status, dispense, dispenseId: dispense.id }),
            ),
        );
    }

    private giveReward(profile: Profile, dispenses: DispenseEntity[]) {
        const prices = dispenses.map((dispense) => {
            return this.priceCalculator.calculate({ ...dispense.offer, count: 1 });
        });

        const reward = prices.reduce((sum, price) => sum + price, 0);
        const userId = profile.owner.id;

        if (reward) {
            return pipe(
                T.fromTask(() => this.usersService.giveHearts(userId)(reward)),
                T.map(() => reward),
            );
        }

        return T.of(reward);
    }

    private validateDispense(
        profile: Profile,
        dispense: DispenseEntity,
    ): TE.TaskEither<Error, DispenseEntity> {
        if (dispense.expires.valueOf() < Date.now()) {
            return TE.left(new Error('Срок действия выдачи истёк'));
        }

        if (dispense.recipientId !== profile.id) {
            return TE.left(new Error(`Для Вас не было выдачи #${dispense.id}`));
        }

        return TE.right(dispense);
    }

    private saveExecutionsFor(profile: Profile, dispenses: DispenseEntity[]): T.Task<Execution[]> {
        if (!dispenses.length) return T.of([]);

        return () => this.executions.save(
            dispenses.map((dispense) => this.executions.create({
                date: new Date(),
                offer: { id: dispense.offerId },
                profile: { id: profile.id },
            })),
        );
    }

    private emitEvents(dispenses: DispenseEntity[]) {
        dispenses.forEach((dispense) => {
            this.eventsService.emit('execution', {
                details: { offerId: dispense.offerId },
                important: false,
                read: false,
                recipient: dispense.recipient,
                type: 'execution',
            });

            this.eventsService.emit('execution', {
                details: { offerId: dispense.offer.id },
                important: false,
                read: false,
                recipient: dispense.offer.ownerId,
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
