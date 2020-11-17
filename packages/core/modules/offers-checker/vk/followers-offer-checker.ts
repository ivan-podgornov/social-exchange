import { LikesOfferChecker } from './likes-offer-checker';

export class FollowersOfferChecker extends LikesOfferChecker {
    protected supported = ['user'];
    protected messages = {
        unsupported: 'Указанная Вами ссылка не ведёт на страницу пользователя',
        bannedUser: 'Пользователь заблокирован',
        closedUser: 'Страница пользователя закрыта',
        deletedUser: 'Пользователь удалён',
        bannedGroup: 'Сообщество заблокировано',
        closedGroup: 'Закрытое сообщество',
        deletedGroup: 'Сообщество удалено',
        privateGroup: 'Частное сообществу',
    };
};
