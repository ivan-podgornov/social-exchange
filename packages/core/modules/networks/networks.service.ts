import { Option, none, some } from 'fp-ts/Option';
import { Task } from 'fp-ts/Task';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { left, right } from 'fp-ts/Either';
import { Network } from './network.entity';
import { Incognito, NetworkType, User } from '@social-exchange/types';
import { UserEntity } from 'modules/users/user.entity';

@Injectable()
export class NetworksService {
    constructor(
        @InjectRepository(Network)
        private networks: Repository<Network>,
    ) {}

    /** Создаёт запись о социальной сети пользователя */
    async create(network: Incognito, owner: User) {
        const userNetwork = this.networks.create({ ...network });
        userNetwork.owner = owner;
        await this.networks.save(userNetwork);
        return userNetwork;
    }

    /** Ищет владельца указанного профиля социальной сети */
    findOwner(network: Incognito): Task<Option<User>> {
        return async () => {
            const uid = network.uid;
            const options = { relations: ['owner'] };
            const profile = await this.networks.findOne({ uid }, options);
            return profile ? some(profile.owner) : none;
        };
    }

    /** Ищет социальную сеть по id пользователя в этой сети */
    async findByUserId(type: NetworkType, uid: number) {
        const network = await this.networks.findOne({ type, uid });
        if (!network) return left(null);
        return right(network);
    }
};
