import fetch from 'node-fetch';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NetworksService } from '../networks/networks.service';
import { UsersService } from '../users/users.service';

import {
    Incognito,
    JwtPayload,
    NetworkType,
    User,
} from '@social-exchange/types';

import {
    chain,
    getOrElseW,
    isRight,
    left,
    right,
    toError,
} from 'fp-ts/Either';

type UloginNetwork = 'vkontakte';
type UloginUser = {
    first_name: string,
    last_name: string,
    network: UloginNetwork,
    photo: string,
    uid: number,
};

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private networksService: NetworksService,
        private usersService: UsersService,
    ) {}

    /** Проводит авторизацию пользователя через uLogin */
    async auth(host: string, token: string) {
        const uloginUserEither = await this.resolveToken(host, token);
        const uloginUser = getOrElseW(toError)(uloginUserEither);
        if (uloginUser instanceof Error) return left(uloginUser);

        const networkType = this.translateUloginNetwork(uloginUser.network);
        const incognito = this.uloginUserToIncognito(uloginUser, networkType);
        const user = await this.networksService.findOwner(incognito);

        return isRight(user)
            ? chain(this.login(incognito))(user)
            : this.register(incognito);
    }

    private login(incognito: Incognito) {
        return (user: User) => {
            const { photo, ...networkPayload } = incognito;
            const payload: JwtPayload = { ...networkPayload, id: user.id };
            return right(this.jwtService.sign(payload));
        };
    }

    private async register(incognito: Incognito) {
        const user = await this.usersService.create();
        const userNetwork = await this.networksService.create(incognito, user);
        return this.login(userNetwork)(user);
    }

    /**
     * Предполгается, что token получен от uLogin. Нужно отправить его назад в
     * uLogin и если host указан правильный, uLogin вернёт информацию об
     * авторизовавшемся пользователе
     */
    private async resolveToken(host: string, token: string) {
        type ErrorResponse = { error: string; };
        const url = `http://ulogin.ru/token.php?host=${host}&token=${token}`;
        const response = await fetch(url);
        const body: ErrorResponse|UloginUser = await response.json();

        return ('error' in body)
            ? left(new Error(body.error))
            : right(body);
    }

    private translateUloginNetwork(network: UloginNetwork): NetworkType {
        type Translator = { [network: string]: NetworkType };
        const translates: Translator = { 'vkontakte': NetworkType.vk };
        return translates[network];
    }

    private uloginUserToIncognito(
        user: UloginUser,
        type: NetworkType,
    ): Incognito {
        return {
            type,
            name: `${user.first_name} ${user.last_name}`,
            photo: user.photo,
            uid: user.uid,
        };
    }
};
