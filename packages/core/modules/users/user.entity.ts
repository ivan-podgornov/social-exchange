import { User } from '@social-exchange/types';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity implements User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: 50 })
    balance!: number;
}
