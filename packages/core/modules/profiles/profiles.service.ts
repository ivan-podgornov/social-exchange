import { Option, none, some } from 'fp-ts/Option';
import { Task } from 'fp-ts/Task';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { left, right } from 'fp-ts/Either';
import { ProfileEntity } from './profile.entity';

import {
    Incognito,
    NetworkType,
    Profile,
    User,
} from '@social-exchange/types';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectRepository(ProfileEntity)
        private profiles: Repository<Profile>,
    ) {}

    /** Создаёт запись о социальной сети пользователя */
    async create(network: Incognito, owner: User) {
        const profile = this.profiles.create({ ...network });
        profile.owner = owner;
        await this.profiles.save(profile);
        return profile;
    }

    /** Ищет владельца указанного профиля социальной сети */
    findOwner(incognito: Incognito): Task<Option<User>> {
        return async () => {
            const uid = incognito.uid;
            const options = { relations: ['owner'] };
            const profile = await this.profiles.findOne({ uid }, options);
            return profile ? some(profile.owner) : none;
        };
    }

    /** Ищет социальную сеть по id пользователя в этой сети */
    async findByUserId(type: NetworkType, uid: number) {
        const profile = await this.profiles.findOne({ type, uid });
        if (!profile) return left(null);
        return right(profile);
    }
};
