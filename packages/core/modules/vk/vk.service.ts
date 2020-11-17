import { Injectable } from '@nestjs/common';
import { VK, APIError } from 'vk-io';
import { Either, chainW, left, right } from 'fp-ts/Either';
import { camelize, decamelize } from '@ridi/object-case-converter';
import { Resource, VkResource } from './resource';

import type {
    VkGroup,
    VkOwner,
    VkPhoto,
    VkPost,
    VkUser,
} from './types';

@Injectable()
export class VkService {
    private vk = new VK({
        appId: Number(process.env.VK_APP_ID),
        appSecret: process.env.VK_APP_SECRET,
        language: 'ru',
        token: process.env.VK_TOKEN,
    });

    async resolveResource(link: string): Promise<Resource> {
        const rawResource = await this.vk.snippets.resolveResource(link);
        const resource = new VkResource(rawResource);
        return resource;
    }

    async getPhotoInfo(resource: Resource) {
        const params = { photos: `${resource.ownerId}_${resource.objectId}` };
        const photos = await this.api<VkPhoto[]>('photos.getById', params);
        const extractor = (photos: VkPhoto[]) => right(photos[0]);
        return chainW(extractor)(photos);
    }

    async getPostInfo(resource: Resource) {
        const params = { posts: `${resource.ownerId}_${resource.objectId}` };
        const posts = await this.api<VkPost[]>('wall.getById', params);
        const extractor = (posts: VkPost[]) => {
            if (!posts.length) {
                const message = 'Похоже пост заархивирован или скрыт';
                return left(new Error(message));
            }

            return right(posts[0]);
        };

        return chainW(extractor)(posts);
    }

    async getOwnerInfo(resource: Resource): Promise<Either<Error, VkOwner>> {
        const ownerId = resource.ownerId || resource.objectId;

        return (ownerId < 0 || resource.type === 'group')
            ? this.getGroupInfo(ownerId)
            : this.getUserInfo(ownerId);
    }

    async getGroupInfo(id: number) {
        const response = await this.api<VkGroup[]>('groups.getById', {
            groupId: Math.abs(id),
            fields: 'photo_50,members_count',
        });

        const extractor = (vkGroups: VkGroup[]) => right(vkGroups[0]);
        return chainW(extractor)(response);
    }

    async getUserInfo(id: number) {
        const response = await this.api<VkUser[]>('users.get', {
            user_ids: id,
            fields: 'photo_50,counters',
        });

        const extractor = (vkUsers: VkUser[]) => right(vkUsers[0]);
        return chainW(extractor)(response);
    }

    async api<Response>(method: string, params: object = {}):
        Promise<Either<Error, Response>>
    {
        try {
            const recursive = true;
            const convertedParams: object = decamelize(params, { recursive });
            const response = await this.vk.api.call(method, convertedParams);
            return right(camelize(response, { recursive }) as Response);
        } catch (error) {
            if (error instanceof APIError) return left(error);
            throw error;
        }
    }

    get collect() {
        return this.vk.collect;
    }
};
