import { OfferType } from '@social-exchange/types';
import { OfferEntity } from '../offers/offer.entity';
import { ProfileEntity } from '../profiles/profile.entity';

import {
    Entity,
    Column,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    RelationId,
} from 'typeorm';

@Entity({ name: 'executions' })
export class Execution {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'datetime' })
    date!: Date;

    @JoinColumn({ name: 'offer_id' })
    @ManyToOne(() => OfferEntity)
    offer!: OfferEntity<OfferType>;

    @RelationId((execution: Execution) => execution.offer)
    offerId!: number;

    @JoinColumn({ name: 'profile_id' })
    @ManyToOne(() => ProfileEntity)
    profile!: ProfileEntity;

    @RelationId((execution: Execution) => execution.profile)
    profileId!: number;
}
