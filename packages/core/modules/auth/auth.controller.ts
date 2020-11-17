import { getOrElseW, toError } from 'fp-ts/Either';
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

        const jwt = await this.authService.auth(query.host, token);
        const jwtToken = getOrElseW(toError)(jwt);
        const host = decodeURI(query.host);
        return { url: `${host}?token=${jwtToken}` };
    }
};
