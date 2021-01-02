import * as TE from 'fp-ts/TaskEither';
import { of } from 'fp-ts/Task';
import { pipe } from 'fp-ts/pipeable';
import { AuthService } from './auth.service';

import {
    Body,
    Controller,
    HttpStatus,
    Post,
    Redirect,
    Query,
} from '@nestjs/common';

type AuthQuery = {
    host?: string;
};

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post()
    @Redirect('https://api.sealikes.com/')
    async login(
        @Query() query: AuthQuery,
        @Body('token') token?: string,
    ) {
        const redirectWithError = (message: string) => ({
            url: `${query.host}?error=${encodeURIComponent(message)}`,
            statusCode: HttpStatus.FOUND,
        });

        if (typeof token !== 'string') {
            const message = 'Param token is required and it must be a string';
            return redirectWithError(message);
        }

        if (typeof query.host !== 'string') {
            const message = 'Query param host is required and it must be a string';
            return redirectWithError(message);
        }

        const host = decodeURI(query.host);
        return pipe(
            this.authService.auth2(host, token),
            TE.fold(
                (error: Error) => of(redirectWithError(error.message)),
                (token: string) => of(({ url: `${host}?token=${token}` })),
            ),
        )();
    }
};
