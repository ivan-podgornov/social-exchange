import * as T from 'fp-ts/Task';
import { pipe } from 'fp-ts/pipeable';
import { Injectable } from '@nestjs/common';
import { Profile, Offer, OfferType } from '@social-exchange/types';
import { camelize } from '@ridi/object-case-converter';
import type { VkResource } from '../vk/resource';
import { VkService } from '../vk/vk.service';
import type { VkPost } from '../vk/types';

@Injectable()
export class VkExecutionsChecker {
    constructor(
        private vkService: VkService,
    ) {}

    check(profile: Profile, offer: Offer) {
        type Checker = (profile: Profile, resource: VkResource) => T.Task<boolean>;
        type Checkers = { [type in OfferType]: Checker };
        const checkers: Checkers = {
            [OfferType.likes]: this.isLiked.bind(this),
            [OfferType.reposts]: this.isReposted.bind(this),
            [OfferType.friends]: this.doesSendFriendRequest.bind(this),
            [OfferType.followers]: this.isFollower.bind(this),
        };

        return pipe(
            T.fromTask(() => this.vkService.resolveResource(offer.link)),
            T.chain((resource) => checkers[offer.type](profile, resource)),
        );
    }

    /** Проверяет, лайкнул ли пользователь указанный ресурс */
    private isLiked(profile: Profile, resource: VkResource): T.Task<boolean> {
        return () => new Promise((resolve, reject) => {
            const stream = this.vkService.collect.likes.getList<number>({
                filter: 'likes',
                item_id: resource.objectId,
                owner_id: resource.ownerId,
                type: resource.type,
            });

            stream.on('error', reject);
            stream.on('end', () => resolve(false));
            stream.on('data', (chunk) => {
                const isLiked = chunk.items
                    .find((item) => item === profile.uid);
                if (isLiked) {
                    stream.destroy();
                    return resolve(true);
                }
            });
        });
    }

    /** Проверяет, репостнул ли пользователь указанный ресурс */
    private isReposted(profile: Profile, resource: VkResource): T.Task<boolean> {
        return () => new Promise((resolve, reject) => {
            const stream = this.vkService.collect.wall.get<VkPost>({
                extended: 1,
                filter: 'owner',
                owner_id: profile.uid,
            });

            stream.on('error', reject);
            stream.on('end', () => resolve(false));
            stream.on('data', (chunk) => {
                const isReposted = chunk.items.find((rawPost) => {
                    const post = camelize(rawPost, { recursive: true }) as VkPost;
                    if (!post.copyHistory) return false;
                    return this.hasRepostResource(post.copyHistory[0], resource);
                });

                if (isReposted) {
                    stream.destroy();
                    return resolve(true);
                }
            });
        });
    }

    /** Проверяет, подписан ли пользователь на другого пользователя */
    private doesSendFriendRequest(profile: Profile, resource: VkResource): T.Task<boolean> {
        return () => new Promise((resolve, reject) => {
            const options = { user_id: resource.objectId };
            const followersStream = this.vkService.collect
                .users.getFollowers<number>(options);
            const friendsStream = this.vkService.collect
                .friends.get<number>(options);

            const errorHandler = (error: Error) => {
                if (!followersStream.destroyed) followersStream.destroy();
                if (!friendsStream.destroyed) friendsStream.destroy();
                return reject(error);
            };

            const endHandler = () => {
                if (!followersStream.readableEnded) return;
                if (!friendsStream.readableEnded) return;
                return resolve(false);
            };

            const dataHandler = (data: { items: number[] }) => {
                if (data.items.includes(profile.uid)) {
                    followersStream.destroy();
                    friendsStream.destroy();
                    return resolve(true);
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

    /** Проверяет, состоит ли пользователь в сообществе */
    private isFollower(profile: Profile, resource: VkResource): T.Task<boolean> {
        return () => new Promise((resolve, reject) => {
            const members = this.vkService.collect.groups.getMembers<number>({
                group_id: resource.objectId,
                sort: 'id_desc',
            });

            members.on('error', reject);
            members.on('end', () => resolve(false));
            members.on('data', (data) => {
                const isThere = data.items.includes(profile.uid);
                if (isThere) {
                    members.destroy();
                    return resolve(true);
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
