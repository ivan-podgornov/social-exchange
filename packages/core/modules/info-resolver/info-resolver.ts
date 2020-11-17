import { Injectable } from '@nestjs/common';
import { OfferType } from '@social-exchange/types';
import { VkInfoResolver } from './vk-info-resolver';
import { Resource } from '../vk/resource';

@Injectable()
export class InfoResolver {
    constructor(
        private vkInfoResolver: VkInfoResolver,
    ) {}

    resolve(resource: Resource, type: OfferType) {
        const resolver = this.getResolver(resource);
        return resolver.resolve(resource, type);
    }

    private getResolver(resource: Resource) {
        return this.vkInfoResolver;
    }
}
