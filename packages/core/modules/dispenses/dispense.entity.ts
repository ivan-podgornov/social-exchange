import { Dispense, DispenseStatus } from '@social-exchange/types';
import { OfferEntity } from '../offers/offer.entity';
import { ProfileEntity } from '../profiles/profile.entity';

import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    RelationId,
} from 'typeorm';

@Entity({ name: 'dispenses' })
export class DispenseEntity implements Omit<Dispense, 'title'|'reward'> {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'datetime' })
    expires!: Date;

    @JoinColumn({ name: 'offer_id' })
    @ManyToOne(() => OfferEntity)
    offer!: OfferEntity;

    @RelationId((dispense: DispenseEntity) => dispense.offer)
    offerId!: number;

    @JoinColumn({ name: 'recipient_id' })
    @ManyToOne(() => ProfileEntity)
    recipient!: ProfileEntity;

    @RelationId((dispense: DispenseEntity) => dispense.recipient)
    recipientId!: number;

    @Column({ type: 'enum', enum: DispenseStatus })
    status!: DispenseStatus;
}
