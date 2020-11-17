import { Injectable } from '@nestjs/common';
import { OfferType } from '@social-exchange/types';
import { chainW, getOrElseW, right, left } from 'fp-ts/Either';
import { promiseChain } from 'helpers/promise-chain';
import { VkCoverResolver } from '../cover-resolver/vk-cover-resolver';
import { VkCountersResolver } from '../counters-resolver/vk-counters-resolver';
import { VkService } from '../vk/vk.service';
import { Resource } from '../vk/resource';
import { VkPhoto, VkPost } from '../vk/types';
import type { Info } from './types';

@Injectable()
export class VkInfoResolver {
    constructor(
        private coverResolver: VkCoverResolver,
        private countersResolver: VkCountersResolver,
        private vkService: VkService,
    ) {}

    resolve(resource: Resource, type: OfferType): Promise<Info> {
        switch (resource.type) {
            case 'group': return this.forOwner(resource);
            case 'photo': return this.forPhoto(resource, type);
            case 'post': return this.forPost(resource, type);
            case 'user': return this.forOwner(resource);
            default: {
                const message = `Неизвестный тип ресурса: "${resource.type}"`;
                throw new Error(message);
            }
        }
    }

    private async forOwner(resource: Resource): Promise<Info> {
        const vkOwner = await this.vkService.getOwnerInfo(resource);
        const cover = chainW(this.coverResolver.forOwner)(vkOwner);
        const counter = chainW
            (this.countersResolver.getFollowersCount)(vkOwner);
        const created = right(new Date());
        return [cover, counter, created];
    }

    private async forPhoto(resource: Resource, type: OfferType): Promise<Info> {
        const photo = await this.vkService.getPhotoInfo(resource);
        const cover = chainW(this.coverResolver.forPhoto)(photo);
        const counter = await this.countersResolver.getCounters(resource, type);
        const created = chainW(this.getDate)(photo);
        return [cover, counter, created];
    }

    private async forPost(resource: Resource, type: OfferType): Promise<Info> {
        const method = 'wall.getById';
        const params = { posts: `${resource.ownerId}_${resource.objectId}` };
        const posts = await this.vkService.api<VkPost[]>(method, params);
        const cover = await promiseChain
            (this.resolvePostCover(resource))(posts);
        const counter = await this.countersResolver.getCounters(resource, type);
        const created = chainW(this.getDate)(posts);

        return [cover, counter, created];
    }

    private resolvePostCover(resource: Resource) {
        return async (posts: VkPost[]) => {
            const coverEither = this.coverResolver.forPost(posts);
            const cover = getOrElseW((left: Error|null) => left)(coverEither);
            if (cover === null) {
                const [result] = await this.forOwner(resource);
                return result;
            }

            return cover instanceof Error ? left(cover) : right(cover);
        };
    }

    private getDate(vkResource: VkPhoto|VkPost[]) {
        const { date } = Array.isArray(vkResource) ? vkResource[0] : vkResource;
        return right(new Date(date * 1000));
    }
}
