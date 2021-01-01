import { NetworkType, Profile } from '@social-exchange/types';
import { UserEntity } from '../users/user.entity';

import {
    Entity,
    Column,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    RelationId,
} from 'typeorm';

@Entity({ name: 'profiles' })
export class ProfileEntity implements Profile {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @JoinColumn()
    @OneToOne(() => UserEntity)
    owner!: UserEntity;

    @RelationId((profile: Profile) => profile.owner)
    ownerId!: number;

    @Column()
    photo!: string;

    @Column({ type: 'enum', enum: NetworkType })
    type!: NetworkType;

    @Column()
    uid!: number;
}
