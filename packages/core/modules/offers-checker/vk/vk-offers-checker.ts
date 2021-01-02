import { chain, isLeft, left, right } from 'fp-ts/Either';
import { Injectable } from '@nestjs/common';
import { OfferType } from '@social-exchange/types';
import { VkService } from '../../vk/vk.service';
import type { Checker } from '../types';
import type { CheckerOptions } from '../checker-options';
import { LikesOfferChecker } from './likes-offer-checker';
import { RepostsOfferChecker } from './reposts-offer-checker';
import { FollowersOfferChecker } from './followers-offer-checker';
import { FriendsOfferChecker } from './friends-offer-checker';

@Injectable()
export class VkOffersChecker implements Checker {
    constructor(
        private vkService: VkService
    ) {}

    async check(options: CheckerOptions) {
        const link = chain(this.refersToVk)(options.link);
        const checker = this.getChecker(options);
        const type = chain(this.doesSupportType)(options.type);

        options.setChecks({ link, type });

        if (isLeft(link)) {
            return left(options.toValidationErrors());
        }

        const resource = await this.vkService.resolveResource(options.offer.link);
        const linkValidation = await checker.check(resource);

        if (isLeft(linkValidation) || options.haveLeft()) {
            if (isLeft(linkValidation)) {
                options.setChecks({ link: linkValidation });
            }

            return left(options.toValidationErrors());
        }

        return linkValidation;
    }

    getChecker(options: CheckerOptions) {
        switch (options.offer.type) {
            case OfferType.likes: return new LikesOfferChecker(this.vkService);
            case OfferType.reposts: return new RepostsOfferChecker(this.vkService);
            case OfferType.friends: return new FriendsOfferChecker(this.vkService);
            case OfferType.followers: return new FollowersOfferChecker(this.vkService);
            default: throw new Error('Неизвестный тип оффера');
        }
    }

    /** Проверяет, поддерживает ли система указанный тип задания */
    doesSupportType(type: OfferType) {
        const supportedTypes= Object.keys(OfferType) as OfferType[];

        const doesSupport = supportedTypes.includes(type);
        if (doesSupport) return right(type);

        const message = `"${type}" - неизвестный тип задания.\n`
            + `${supportedTypes.join(', ')} - поддерживаемые типы для `
            + `социальной сети ВКонтакте.`;

        return left(message);
    }

    /** Проверяет, ведёт ли функция на vk.com */
    private refersToVk(link: string) {
        const result = /^(https?:\/\/)?(m\.)?vk\.com/.test(link);
        if (result) return right(link);

        const message = `Ссылка "${link}" не относится ко ВКонтакте`;
        return left(message);
    }
};
