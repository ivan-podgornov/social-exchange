import { EventTypes } from '@social-exchange/types';
import { UserEntity } from '../users/user.entity';

import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    RelationId,
} from 'typeorm';

@Entity({ name: 'events' })
export class EventEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'json' })
    details!: object;

    @Column()
    read!: boolean;

    @Column()
    type!: EventTypes;

    @JoinColumn({ name: 'user_id' })
    @ManyToOne(() => UserEntity)
    user!: UserEntity;

    @RelationId((event: EventEntity) => event.user)
    userId!: number;
}
