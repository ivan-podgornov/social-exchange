import * as TE from 'fp-ts/TaskEither';
import { Option, fold } from 'fp-ts/Option';
import { Task } from 'fp-ts/Task';
import { pipe } from 'fp-ts/pipeable';
import fetch from 'node-fetch';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfilesService } from '../profiles/profiles.service';
import { UsersService } from '../users/users.service';

import {
    Incognito,
    JwtPayload,
    NetworkType,
    User,
} from '@social-exchange/types';

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
        private profilesService: ProfilesService,
        private usersService: UsersService,
    ) {}

    auth2(host: string, token: string) {
        const doAuth = (incognito: Incognito, optionUser: Option<User>) => {
            return fold(
                () => TE.fromTask<Error, string>(this.register(incognito)),
                (user: User) => TE.of(this.login(incognito, user)),
            )(optionUser);
        };

        return pipe(
            this.resolveToken(host, token),
            TE.map((uloginUser) => this.uloginUserToIncognito(uloginUser)),
            TE.chain((incognito) => pipe(
                TE.fromTask<Error, Option<User>>(this.profilesService.findOwner(incognito)),
                TE.chain((optionUser) => doAuth(incognito, optionUser)),
            )),
        );
    }

    private login(incognito: Incognito, user: User) {
        const { photo, ...networkPayload } = incognito;
        const payload: JwtPayload = { ...networkPayload, id: user.id };
        return this.jwtService.sign(payload);
    }

    private register(incognito: Incognito): Task<string> {
        return async () => {
            const user = await this.usersService.create();
            const profile = await this.profilesService.create(incognito, user);
            return this.login(profile, user);
        };
    }

    /**
     * Предполгается, что token получен от uLogin. Нужно отправить его назад в
     * uLogin и если host указан правильный, uLogin вернёт информацию об
     * авторизовавшемся пользователе
     */
    private resolveToken(host: string, token: string) {
        type ErrorResponse = { error: string };
        type Body = ErrorResponse|UloginUser;

        const sendRequest = (url: string): Task<Body> => async () => {
            const response = await fetch(url);
            const body: Body = await response.json();
            return body;
        };

        const checkError = (body: Body): TE.TaskEither<Error, UloginUser> => {
            return 'error' in body
                ? TE.left(new Error(body.error))
                : TE.right(body);
        };

        return pipe(
            `http://ulogin.ru/token.php?host=${host}&token=${token}`,
            (url) => TE.fromTask<Error, Body>(sendRequest(url)),
            TE.chain(checkError),
        );
    }

    private translateUloginNetwork(network: UloginNetwork): NetworkType {
        type Translates = { [network in UloginNetwork]: NetworkType };
        const translates: Translates = { 'vkontakte': NetworkType.vk };
        return translates[network];
    }

    private uloginUserToIncognito(user: UloginUser): Incognito {
        return {
            type: this.translateUloginNetwork(user.network),
            name: `${user.first_name} ${user.last_name}`,
            photo: user.photo,
            uid: user.uid,
        };
    }
};
