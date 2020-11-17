import { apiErrors, APIError } from 'vk-io';
import { series } from 'helpers/task-runner';
import { VkService } from '../../vk/vk.service';
import { Resource } from '../../vk/resource';
import { VkOwner, isVkUser } from '../../vk/types';

import {
    fold,
    getOrElse,
    left,
    right,
    isLeft,
    toError,
} from 'fp-ts/Either';

export class LikesOfferChecker {
    protected supported = ['photo', 'post'];
    protected messages = {
        unsupported: 'Указанный Вами ресурс не предназначен для лайков',
        bannedUser: 'Пользователь, которому принадлежит объект, заблокирова',
        closedUser: 'Страница пользователя, которому принадлежит объект, закрыта',
        deletedUser: 'Пользователь, которому принадлежит объект, удалён',
        bannedGroup: 'Сообщество, которому принадлежит объект, заблокировано',
        closedGroup: 'Указанный Вами объект принадлежит закрытому сообществу',
        deletedGroup: 'Сообщество, которому принадлежит объект, удалено',
        privateGroup: 'Указанный Вами объект принадлежит частному сообществу',
    };

    constructor(private vkService: VkService) {}

    check(resource: Resource) {
        const tasks = [
            this.isSupported.bind(this),
            this.isOpenedOwner.bind(this),
        ];

        if (resource.type === 'photo') {
            tasks.push(this.isOpenedAlbum.bind(this));
        }

        if (resource.type === 'post') {
            tasks.push(this.isOpenedPost.bind(this));
        }

        return series(tasks)(resource);
    }

    /** Проверяет, можно ли лайкнуть ресурс */
    private isSupported(resource: Resource) {
        if (this.supported.includes(resource.type)) {
            return right(resource);
        }

        return left(this.messages.unsupported);
    }

    /** Проверяет, доступна ли страница владельца ресурса */
    private async isOpenedOwner(resource: Resource) {
        const owner = await this.vkService.getOwnerInfo(resource);
        const checkOwnerResult = fold(
            (error: Error) => left(error.message),
            (vkOwner: VkOwner) => this.checkOwner(vkOwner),
        )(owner);

        return isLeft(checkOwnerResult) ? checkOwnerResult : right(resource);
    }

    /** Проверяет информацию о владельце ресурса */
    private checkOwner(info: VkOwner) {
        const { messages } = this;

        if (info.isClosed) {
            const groupMessage = info.isClosed === 1
                ? messages.closedGroup : messages.privateGroup;
            const message = isVkUser(info) ? messages.closedUser : groupMessage;
            return left(message);
        }

        if (info.deactivated) {
            const userMessage = info.deactivated === 'banned'
                ? messages.bannedUser : messages.deletedUser;
            const groupMessage = info.deactivated === 'banned'
                ? messages.bannedGroup : messages.deletedGroup;
            const message = isVkUser(info) ? userMessage : groupMessage;
            return left(message);
        }

        return right(info);
    }

    /** Проверяет, открыт ли альбом в котором находится фотография */
    private async isOpenedAlbum(resource: Resource) {
        const result = await this.vkService.getPhotoInfo(resource);

        if (isLeft(result)) {
            const error = getOrElse(toError)(result);
            const code = apiErrors.ALBUM_ACCESS_DENIED;
            if (error instanceof APIError && error.code === code) {
                return left('Фотография находится в закрытом альбоме');
            }

            return left(error.message);
        }

        return right(resource);
    }

    /** Проверяет, не заархивирован и не скрыт ли пост */
    private async isOpenedPost(resource: Resource) {
        if (resource.type !== 'post') return left('Ресурс не является постом');
        const result = await this.vkService.getPostInfo(resource);

        if (isLeft(result)) {
            const error = getOrElse((error: Error) => error)(result);
            const code = apiErrors.ALBUM_ACCESS_DENIED;
            if (error instanceof APIError && error.code === code) {
                return left('Похоже пост заархивирован или скрыт');
            }

            return left(error.message);
        }

        return right(resource);
    }
}
