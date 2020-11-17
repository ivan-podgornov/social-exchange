import { LikesOfferChecker } from './likes-offer-checker';

export class RepostsOfferChecker extends LikesOfferChecker {
    protected messages = {
        unsupported: 'Указанный Вами ресурс не предназначен для репостов',
        bannedUser: 'Пользователь, которому принадлежит объект, заблокирова',
        closedUser: 'Страница пользователя, которому принадлежит объект, закрыта',
        deletedUser: 'Пользователь, которому принадлежит объект, удалён',
        bannedGroup: 'Сообщество, которому принадлежит объект, заблокировано',
        closedGroup: 'Указанный Вами объект принадлежит закрытому сообществу',
        deletedGroup: 'Сообщество, которому принадлежит объект, удалено',
        privateGroup: 'Указанный Вами объект принадлежит частному сообществу',
    };
};
