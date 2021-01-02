import { getOrElseW } from 'fp-ts/Either';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '@social-exchange/types';
import { ProfilesService } from '../profiles/profiles.service';
import { UsersService } from '../users/users.service';
import { jwtOptions } from './jwt-options';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private networksService: ProfilesService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                ExtractJwt.fromUrlQueryParameter('token'),
            ]),
            ignoreExpiration: false,
            secretOrKey: jwtOptions.secret,
        });
    }

    async validate(payload: JwtPayload) {
        const [userEither, networkEither] = await Promise.all([
            this.usersService.findById(payload.id),
            this.networksService.findByUserId(
                payload.type,
                payload.uid,
            ),
        ]);

        const user = getOrElseW((left: null) => left)(userEither);
        if (user === null) throw new ForbiddenException();
        const profile = getOrElseW((left: null) => left)(networkEither);
        if (profile === null) throw new ForbiddenException();
        profile.owner = user;

        return { user, profile };
    }
}
