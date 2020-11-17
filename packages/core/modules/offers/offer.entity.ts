import { UserEntity } from '../users/user.entity';

import {
    NetworkType,
    Offer,
    OfferStatus,
    OfferType,
} from '@social-exchange/types';

import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'offers' })
export class OfferEntity implements Offer {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    count!: number;

    @JoinColumn()
    countExecutions!: number;

    @Column()
    counter!: number;

    @Column({ type: 'datetime', name: 'created_at' })
    createdAt!: Date;

    @Column({ type: 'datetime', name: 'object_created' })
    objectCreated!: Date|null;

    @Column()
    cover!: string;

    @Column({ type: 'datetime', name: 'finished_at', nullable: true })
    finishedAt!: Date|null;

    @Column()
    link!: string;

    @Column({ type: 'enum', enum: NetworkType })
    networkType!: NetworkType;

    @Column({ name: 'owner_id' })
    ownerId!: number;

    @JoinColumn({ name: 'owner_id' })
    @ManyToOne(() => UserEntity)
    owner!: UserEntity;

    @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.active })
    status!: OfferStatus;

    @Column({ type: 'enum', enum: OfferType })
    type!: OfferType;
};
