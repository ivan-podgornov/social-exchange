import { Injectable } from '@nestjs/common';
import { OfferType } from '@social-exchange/types';
import { chainW, right } from 'fp-ts/Either';
import { VkService } from '../vk/vk.service';
import { Resource } from '../vk/resource';
import { VkOwner, isVkUser } from '../vk/types';

@Injectable()
export class VkCountersResolver {
    constructor(private vkService: VkService) {}

    /**
     * Для группы возвращает количество участников. Для пользователя - суммарное
     * количество друзей и подписчиков.
     */
    getFollowersCount(vkOwner: VkOwner) {
        const followers = isVkUser(vkOwner)
            ? vkOwner.counters.followers + (vkOwner.counters.friends || 0)
            : vkOwner.membersCount;
        return right(followers);
    }

    /** Вовращает количество лайков для ресурса */
    async getCounters(resource: Resource, type: OfferType) {
        type Response = { count: number };
        const response = await this.vkService.api<Response>('likes.getList', {
            count: 1,
            filter: type === OfferType.reposts ? 'copies' : 'likes',
            itemId: resource.objectId,
            offset: 0,
            ownerId: resource.ownerId,
            type: resource.type,
        });

        const extractor = (response: Response) => right(response.count);
        return chainW(extractor)(response);
    }
}
