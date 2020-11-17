import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { left, right } from 'fp-ts/Either';
import { Network } from './network.entity';
import { Incognito, NetworkType, User } from '@social-exchange/types';

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

    /** Ищет владельца указанной социальной сети */
    async findOwner(network: Incognito) {
        const userNetwork = await this.networks
            .findOne({ uid: network.uid }, { relations: ['owner'] });
        if (!userNetwork) return left(null);
        return right(userNetwork.owner);
    }

    /** Ищет социальную сеть по id пользователя в этой сети */
    async findByUserId(type: NetworkType, uid: number) {
        const network = await this.networks.findOne({ type, uid });
        if (!network) return left(null);
        return right(network);
    }
};
