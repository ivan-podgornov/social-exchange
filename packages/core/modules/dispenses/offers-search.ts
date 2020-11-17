import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OfferStatus, OfferType } from '@social-exchange/types';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Execution } from '../executions/execution.entity';
import { OfferEntity } from '../offers/offer.entity';
import { DispenseEntity } from './dispense.entity';
import { DispenseOptions } from './dispenser';

@Injectable()
export class OffersSearch {
    constructor(
        @InjectRepository(DispenseEntity)
        private dispenses: Repository<DispenseEntity>,

        @InjectRepository(Execution)
        private executions: Repository<Execution>,

        @InjectRepository(OfferEntity)
        private offers: Repository<OfferEntity>,
    ) {}

    /**
     * Возвращает активные задания указанного типа, связанные с указанной
     * социальной сетью, которые не принадлежат и не выдавались получателю;
     * которые не достигли лимита
     */
    search<T extends OfferType>(options: DispenseOptions<T>, limit: number) {
        return this.offers.createQueryBuilder('offer')
            .select('offer.*')
            .addSelect('IFNULL(dispenses_count.count, 0)', 'dispenses_count')
            .addSelect('IFNULL(executions_count.count, 0)', 'executions_count')
            .innerJoin((qb: SelectQueryBuilder<OfferEntity>) => qb
                .select('link')
                .addSelect('MIN(created_at)', 'min_created_at')
                .from(OfferEntity, 'min')
                .where(`status = '${OfferStatus.active}'`)
                .groupBy('link')
            , 'min', 'offer.link = min.link')
            .leftJoin(
                this.getDispensesCount.bind(this, options),
                'dispenses_count',
                'offer.link = dispenses_count.link',
            )
            .leftJoin((qb: SelectQueryBuilder<OfferEntity>) => qb
                .select('execution.id, execution.offer_id')
                .addSelect('COUNT(execution.offer_id)', 'count')
                .from(Execution, 'execution')
                .groupBy('execution.id, execution.offer_id')
            , 'executions_count', 'offer.id = executions_count.offer_id')
            .where('offer.owner_id != :userId')
            .andWhere('offer.created_at = min.min_created_at')
            .andWhere('IFNULL(executions_count.count, 0) '
                + '+ IFNULL(dispenses_count.count, 0) < offer.count')
            .andWhere('offer.networkType = :networkType')
            .andWhere('offer.type = :offerType')
            .andWhere(`offer.status = '${OfferStatus.active}'`)
            .andWhere(
                'IFNULL(dispenses_count.count, 0) < '
                    + this.getLimitFormula(options),
            )
            .andWhere(() => {
                const query = this.getUserDispensesLinks(options).getQuery();
                return `offer.link NOT IN ${query}`;
            })
            .andWhere(() => {
                const query = this.getUserExecutionsLinks(options).getQuery();
                return `offer.link NOT IN ${query}`;
            })
            .setParameters(options)
            .orderBy('RAND()')
            .limit(limit)
            .getRawMany() as Promise<OfferEntity[]>;
    }

    /** Возвращает SQL формулу для расчёта лимита */
    private getLimitFormula(options: DispenseOptions<OfferType>) {
        const todayDelitimer = '(CASE '
            + 'WHEN '
                + 'YEAR(offer.object_created) = YEAR(CURRENT_DATE) AND '
                + 'DAYOFYEAR(offer.object_created) = DAYOFYEAR(CURRENT_DATE) '
            + 'THEN 2 '
            + 'ELSE 1 '
            + 'END)';
        
        if ([OfferType.likes, OfferType.reposts].includes(options.offerType)) {
            return '100 / ' + todayDelitimer;
        }

        return '(CASE '
            + 'WHEN offer.counter + IFNULL(dispenses_count.count, 0) > 1500 '
            + 'THEN CEILING(75 + offer.counter + IFNULL(dispenses_count.count, 0) / 1000) '
            + 'WHEN offer.counter + IFNULL(dispenses_count.count, 0) / 1000 * 5 < 18 '
            + 'THEN 18 '
            + 'ELSE CEILING(offer.counter + IFNULL(dispenses_count.count, 0) / 1000 * 5) '
            + 'END) / ' + todayDelitimer;
    }

    /** Возвращает количество выдач, срок действия которых не истёк */
    private getDispensesCount(options: DispenseOptions<OfferType>) {
        return this.dispenses.createQueryBuilder('dispense')
            .subQuery()
            .select('offer.link, offer.type, offer.networkType')
            .from(DispenseEntity, 'dispense')
            .addSelect('COUNT(offer.link)', 'count')
            .innerJoin(
                OfferEntity, 'offer',
                'dispense.offer_id = offer.id AND '
                    + 'offer.networkType = :networkType AND '
                    + 'offer.type = :offerType',
                options,
            )
            .where('dispense.expires > CURRENT_TIMESTAMP')
            .groupBy('offer.link, offer.type, offer.networkType');
    }

    /**
     * Возвращает sql запрос, рузельтатом выполнения которого будут выдачи, срок
     * действия которых не истёк, с полученной информацией о ссылке задания.
     */
    private getUserDispensesLinks(options: DispenseOptions<OfferType>) {
        return this.dispenses.createQueryBuilder('dispense')
            .subQuery()
            .select('DISTINCT(offer.link)')
            .from(DispenseEntity, 'dispense')
            .innerJoin(
                OfferEntity, 'offer',
                'dispense.recipient_id = :recipientId AND '
                    + 'dispense.expires > CURRENT_TIMESTAMP AND '
                    + 'dispense.offer_id = offer.id AND '
                    + 'offer.networkType = :networkType AND '
                    + 'offer.type = :offerType',
                options,
            );
    }

    private getUserExecutionsLinks(options: DispenseOptions<OfferType>) {
        return this.executions.createQueryBuilder('executions')
            .subQuery()
            .select('offer.link')
            .from(Execution, 'execution')
            .innerJoin(
                OfferEntity, 'offer',
                'execution.profile_id = :recipientId AND '
                    + 'execution.offer_id = offer.id AND '
                    + 'offer.networkType = :networkType AND '
                    + 'offer.type = :offerType',
                options,
            );
    }
}
