import { getOrElseW } from 'fp-ts/Either';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '@social-exchange/types';
import { NetworksService } from '../networks/networks.service';
import { UsersService } from '../users/users.service';
import { jwtOptions } from './jwt-options';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private networksService: NetworksService,
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
        const network = getOrElseW((left: null) => left)(networkEither);
        if (network === null) throw new ForbiddenException();
        network.owner = user;

        return { user, network };
    }
}
