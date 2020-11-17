import { OfferEntity } from '../offers/offer.entity';
import { Network } from '../networks/network.entity';
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
    offer!: OfferEntity;

    @RelationId((execution: Execution) => execution.offer)
    offerId!: number;

    @JoinColumn({ name: 'profile_id' })
    @ManyToOne(() => Network)
    profile!: Network;

    @RelationId((execution: Execution) => execution.profile)
    profileId!: number;
}
