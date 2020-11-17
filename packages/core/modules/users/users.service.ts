import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@social-exchange/types';
import { left, right } from 'fp-ts/Either';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private users: Repository<UserEntity>,
    ) {}

    async create() {
        const user = this.users.create();
        await this.users.save(user);
        return user;
    }

    async findById(id: number) {
        const user = await this.users.findOne({ id });
        return user ? right(user) : left(null);
    }

    takeHearts(user: User|number) {
        return async (amount: number) => {
            await this.giveHearts(user)(-amount);
        };
    }

    giveHearts(user: User|number) {
        return async (amount: number) => {
            const id = typeof user === 'number' ? user : user.id;
            await this.users.update({ id }, {
                balance: () => `users.balance + ${amount}`,
            });
        };
    }
};
