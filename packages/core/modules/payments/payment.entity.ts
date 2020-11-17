import { UserEntity } from '../users/user.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

export enum PaymentStatus {
    check = 'check',
    error = 'error',
    preauth = 'preauth',
    pay = 'pay',
};

@Entity({ name: 'payments' })
export class PaymentEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'datetime' })
    date!: Date;

    @Column({ nullable: true, default: null })
    error!: string;

    @JoinColumn({ name: 'owner_id' })
    @ManyToOne(() => UserEntity)
    owner!: UserEntity;

    @Column({ name: 'owner_id' })
    ownerId!: number;

    @Column({ type: 'enum', enum: PaymentStatus })
    status!: PaymentStatus;

    @Column()
    sum!: number;

    @Column({ name: 'unitpay_id', unique: true })
    unitpayId!: number;
}
