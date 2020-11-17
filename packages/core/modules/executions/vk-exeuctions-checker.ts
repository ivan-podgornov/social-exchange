import { Injectable } from '@nestjs/common';
import { Profile, Offer, OfferType } from '@social-exchange/types';
import { camelize } from '@ridi/object-case-converter';
import { Either, left, right } from 'fp-ts/Either';
import type { VkResource } from '../vk/resource';
import { VkService } from '../vk/vk.service';
import type { VkPost } from '../vk/types';

type Check = Promise<Either<Error, boolean>>;

@Injectable()
export class VkExecutionsChecker {
    constructor(
        private vkService: VkService,
    ) {}

    async check(network: Profile, offer: Offer) {
        const resource = await this.vkService.resolveResource(offer.link);

        switch (offer.type) {
            case OfferType.likes: return this.isLiked(network, resource);
            case OfferType.reposts: return this.isReposted(network, resource);
            case OfferType.followers: return this.isFollow(network, resource);
            case OfferType.subscribes:
                return this.isSubscribe(network, resource);
            default: throw Error('Неизвесный тип задания');
        }
    }

    /** Проверяет, лайкнул ли пользователь указанное задание */
    private isLiked(profile: Profile, resource: VkResource): Check {
        return new Promise((resolve, reject) => {
            const stream = this.vkService.collect.likes.getList<number>({
                filter: 'likes',
                item_id: resource.objectId,
                owner_id: resource.ownerId,
                type: resource.type,
            });

            stream.on('error', (error: Error) => reject(left(error)));
            stream.on('end', () => resolve(right(false)));
            stream.on('data', (chunk) => {
                const isLiked = chunk.items
                    .find((item) => item === profile.uid);
                if (isLiked) {
                    stream.destroy();
                    return resolve(right(true));
                }
            });
        });
    }

    /** Проверяет, репостнул ли пользователь указанное задание */
    private isReposted(profile: Profile, resource: VkResource): Check {
        return new Promise((resolve, reject) => {
            const stream = this.vkService.collect.wall.get<VkPost>({
                extended: 1,
                filter: 'owner',
                owner_id: profile.uid,
            });

            stream.on('error', (error: Error) => reject(left(error)));
            stream.on('end', () => resolve(right(false)));
            stream.on('data', (chunk) => {
                const isReposted = chunk.items.find((rawPost) => {
                    const post = camelize(rawPost, { recursive: true }) as VkPost;
                    if (!post.copyHistory) return false;
                    return this.hasRepostResource(post.copyHistory[0], resource);
                });

                if (isReposted) {
                    stream.destroy();
                    return resolve(right(true));
                }
            });
        });
    }

    /** Проверяет, подписан ли пользователь на другого пользователя */
    private isFollow(profile: Profile, resource: VkResource): Check {
        return new Promise((resolve, reject) => {
            const options = { user_id: resource.objectId };
            const followersStream = this.vkService.collect
                .users.getFollowers<number>(options);
            const friendsStream = this.vkService.collect
                .friends.get<number>(options);

            const errorHandler = (error: Error) => {
                if (!followersStream.destroyed) followersStream.destroy();
                if (!friendsStream.destroyed) friendsStream.destroy();
                return reject(left(error));
            };

            const endHandler = () => {
                if (!followersStream.readableEnded) return;
                if (!friendsStream.readableEnded) return;
                return resolve(right(false));
            };

            const dataHandler = (data: { items: number[] }) => {
                if (data.items.includes(profile.uid)) {
                    followersStream.destroy();
                    friendsStream.destroy();
                    return resolve(right(true));
                }
            };

            followersStream.on('error', errorHandler);
            friendsStream.on('error', errorHandler);
            followersStream.on('end', endHandler);
            friendsStream.on('end', endHandler);
            followersStream.on('data', dataHandler);
            friendsStream.on('data', dataHandler);
        });
    }

    /** Проверяет, состоит ли пользователь в группе */
    private async isSubscribe(profile: Profile, resource: VkResource): Check {
        return new Promise((resolve, reject) => {
            const members = this.vkService.collect.groups.getMembers<number>({
                group_id: resource.objectId,
                sort: 'id_desc',
            });

            members.on('error', (error: Error) => reject(left(error)));
            members.on('end', () => resolve(right(false)));
            members.on('data', (data) => {
                const isThere = data.items.includes(profile.uid);
                if (isThere) {
                    members.destroy();
                    return resolve(right(true));
                }
            });
        });
    }

    private hasRepostResource(post: VkPost, resource: VkResource) {
        if (post.postType !== resource.type) return false;
        if (post.ownerId !== resource.ownerId) return false;
        if (post.id !== resource.objectId) return false;

        return true;
    }
}
