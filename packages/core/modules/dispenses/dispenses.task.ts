import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ConnectionsService } from '../connections/connections.service';
import { Execution } from '../executions/execution.entity';
import { OfferEntity } from '../offers/offer.entity';
import { ProfileEntity } from '../profiles/profile.entity';
import { EventsService } from '../events/events.service';
import { DispenseEntity } from './dispense.entity';
import { Dispenser } from './dispenser';

import {
    DispenseStatus,
    NetworkType,
    OfferType,
    Profile,
} from '@social-exchange/types';

type Options = {
    offerType: OfferType,
    networkType: NetworkType,
};

// TODO: Четыре метода, которые запускаются через интервалы, лучше переделать
// на динамические интервалы. А то жесть какая-то

@Injectable()
export class DispensesTask {
    constructor(
        private connectionsService: ConnectionsService,
        private dispenser: Dispenser,
        private eventsService: EventsService,

        @InjectRepository(ProfileEntity)
        private profiles: Repository<Profile>,
    ) {}

    @Interval('dispenses', 10000)
    dispenseLikesNeedy() {
        this.dispenseNeedy({
            networkType: NetworkType.vk,
            offerType: OfferType.likes,
        });
    }

    @Interval('dispenses-reposts', 15000)
    dispenseRepostsNeedy() {
        this.dispenseNeedy({
            networkType: NetworkType.vk,
            offerType: OfferType.reposts,
        });
    }

    @Interval('dispenses-friends', 20000)
    dispenseFollowersNeedy() {
        this.dispenseNeedy({
            networkType: NetworkType.vk,
            offerType: OfferType.friends,
        });
    }

    @Interval('dispenses-followers', 25000)
    dispenseSubscibesNeedy() {
        this.dispenseNeedy({
            networkType: NetworkType.vk,
            offerType: OfferType.followers,
        });
    }

    private async dispenseNeedy(options: Options) {
        const needies = await this.findNeedies(options);
        for (const recipient of needies) {
            const dispenses = await this.dispenser.dispense(recipient);
            const typeDispenses = dispenses[options.offerType];
            if (!typeDispenses.list.length && !typeDispenses.reachLimit) continue;

            this.eventsService.emit('dispenses', {
                recipient,
                details: dispenses,
                important: false,
                read: false,
                type: 'dispenses',
            });
        }
    }

    /** Ищет посетителей, которые нуждаются в заданиях для выполнения */
    private async findNeedies(options: Options) {
        const profilesIds = this.connectionsService.connectedProfiles
            .filter((profile) => profile.type === options.networkType)
            .map((profile) => profile.id);
        if (!profilesIds.length) return [];

        const rawVisitors: Profile[] = await this.profiles
            .createQueryBuilder('profile')
            .select('profile.*')
            .addSelect('IFNULL(dispense.dispensesCount, 0)', 'dispensesCount')
            .addSelect('IFNULL(execution.executionsCount, 0)', 'executionsCount')
            .addSelect('IFNULL(lastExecution.executionTimeout, 1000)', 'executionTimeout')
            .leftJoin(
                this.dispensesCount(options),
                'dispense',
                'profile.id = dispense.recipient_id',
            )
            .leftJoin(
                this.executionsCount(options),
                'execution',
                'profile.id = execution.profile_id',
            )
            .leftJoin(
                this.lastExecutionTimeout(options),
                'lastExecution',
                'profile.id = lastExecution.profile_id',
            )
            .where('profile.id IN (:profilesIds)', { profilesIds })
            .andWhere('profile.type = :networkType', options)
            .andWhere('IFNULL(executionTimeout, 1000) > 30')
            .andWhere('IFNULL(dispensesCount, 0) < 3')
            .andWhere('IFNULL(dispensesCount + executionsCount, 0) < 30')
            .orderBy('dispensesCount', 'ASC')
            .getRawMany();

        return rawVisitors.map((visitor) => {
            const profile = this.profiles.create(visitor);
            profile.ownerId = visitor.ownerId;
            return profile;
        });
    }

    /**
     * Возвращает подзапрос, который подсчитывает количество выдач для заданий,
     * которые относятся к определённой социальной сети, имеют определённый тип
     * и срок выдачи которых ещё не истёк
     */
    private dispensesCount(options: Options) {
        return (qb: SelectQueryBuilder<DispenseEntity>) => qb
            .select('dispense.recipient_id')
            .addSelect('COUNT(dispense.recipient_id)', 'dispensesCount')
            .from(DispenseEntity, 'dispense')
            .innerJoin(
                OfferEntity, 'offer',
                'dispense.offer_id = offer.id AND '
                    + 'offer.networkType = :networkType AND '
                    + 'offer.type = :offerType',
                options,
            )
            .where('dispense.status = :dispenseStatus')
            .andWhere('dispense.expires > CURRENT_TIMESTAMP')
            .setParameters({ dispenseStatus: DispenseStatus.active })
            .groupBy('dispense.recipient_id');
    }

    /**
     * Возвращает подзапрос, который подсчитывает количество выполнений заданий
     * указанной соц. сети, указанного типа за последние 24 часа.
     */
    private executionsCount(options: Options) {
        return (qb: SelectQueryBuilder<Execution>) => qb
            .select('execution.profile_id')
            .addSelect('COUNT(execution.profile_id)', 'executionsCount')
            .from(Execution, 'execution')
            .innerJoin(
                OfferEntity, 'offer',
                'execution.offer_id = offer.id AND '
                    + 'offer.networkType = :networkType AND '
                    + 'offer.type = :offerType',
                options,
            )
            /* Количество часов с момента выполнения меньше 24 часов */
            .where('YEAR(CURRENT_TIMESTAMP) = YEAR(execution.date)')
            .andWhere('DAYOFYEAR(CURRENT_TIMESTAMP) - DAYOFYEAR(execution.date) <= 1')
            .andWhere(''
                + '(((DAYOFYEAR(CURRENT_TIMESTAMP) - DAYOFYEAR(execution.date)) * 24) '
                + '+ HOUR(CURRENT_TIMESTAMP) - HOUR(execution.date)) < 24')
            /* ----------------------------------------------------- */
            .groupBy('execution.profile_id');
    }

    private lastExecutionTimeout(options: Options) {
        return (qb: SelectQueryBuilder<Execution>) => qb
            .select('execution.profile_id')
            .addSelect(
                'TIMESTAMPDIFF(SECOND, execution.date, CURRENT_TIMESTAMP)',
                'executionTimeout',
            )
            .from(Execution, 'execution')
            .innerJoin(
                OfferEntity, 'offer',
                'execution.offer_id = offer.id AND '
                    + 'offer.networkType = :networkType AND '
                    + 'offer.type = :offerType',
                options,
            )
            .orderBy('executionTimeout', 'ASC')
            /* Количество часов с момента выполнения меньше 24 часов */
            .where('YEAR(CURRENT_TIMESTAMP) = YEAR(execution.date)')
            .andWhere('DAYOFYEAR(CURRENT_TIMESTAMP) - DAYOFYEAR(execution.date) <= 1')
            .andWhere(''
                + '(((DAYOFYEAR(CURRENT_TIMESTAMP) - DAYOFYEAR(execution.date)) * 24) '
                + '+ HOUR(CURRENT_TIMESTAMP) - HOUR(execution.date)) < 24')
            /* ----------------------------------------------------- */
            .limit(1);
    }
}
