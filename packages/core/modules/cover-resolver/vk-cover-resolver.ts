import { Injectable } from '@nestjs/common';
import { right, left } from 'fp-ts/Either';
import type { VkOwner, VkPost, VkPhoto } from '../vk/types';

@Injectable()
export class VkCoverResolver {
    /** Возвращает ссылку на аватарку пользователя или группы */
    forOwner(vkOwner: VkOwner) {
        return right(vkOwner.photo50);
    }

    /** Вовращает ссылку на уменьшенную копию фотографии */
    forPhoto(photo: VkPhoto) {
        const size = photo.sizes.find((size) => size.type === 's');
        if (size === undefined) {
            const message = 'У фото нет уменьшенной копии';
            throw new Error(message);
        }

        type Size = VkPhoto['sizes'][0];
        return right((size as Size).url);
    }

    /**
     * Если к посту прикреплена фотография, возвращает ссылку на уменьшенную
     * копию этой фотографии. Если ни одной фотографии не прикреплено,
     * возвращает null.
     */
    forPost(posts: VkPost[]) {
        if (!posts.length) return left(null);
        const [post] = posts;
        if (!post.attachments?.length) return left(null);

        const attachemnt = post.attachments
            .find((attachment) => attachment.type === 'photo');
        if (!attachemnt) return left(null);

        const photo = attachemnt.photo?.sizes
            .find((size) => size.type === 's');
        if (!photo) return left(null);

        return right(photo.url);
    }
}
