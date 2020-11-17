import { Injectable } from '@nestjs/common';
import { Offer, OfferType } from '@social-exchange/types';
import { VkService } from '../vk/vk.service';
import { Resource } from '../vk/resource';

@Injectable()
export class TitleResolver {
    constructor(
        private vkService: VkService,
    ) {}

    async resolve(offer: Offer) {
        const resource = await this.vkService.resolveResource(offer.link);
        const verb = this.getVerb(offer);
        const noun = this.getNoun(resource);
        return `${verb} ${noun}`;
    }

    private getVerb(offer: Offer) {
        type Titles = { [key in OfferType]: string };
        const titles: Titles = {
            [OfferType.likes]: 'Лайкни',
            [OfferType.reposts]: 'Репостни',
            [OfferType.followers]: 'Подпишись',
            [OfferType.subscribes]: 'Подпишись',
        };

        return titles[offer.type];
    }

    private getNoun(resource: Resource) {
        type Titles = { [key in Resource['type']]: string };
        const titles: Titles = {
            group: 'на сообщество',
            photo: 'фотографию',
            post: 'запись на стене',
            user: 'на пользователя',
        };

        return titles[resource.type];
    }
};
