import { Controller, Get, UseGuards } from '@nestjs/common';
import { Incognito, Profile, User } from '@social-exchange/types';
import { JwtGuard } from '../auth/jwt.guard';
import { Profile as WithProfile } from '../profiles/profile.decorator';
import { User as WithUser } from '../users/user.decorator';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
    @Get()
    get(
        @WithProfile() profile: Profile,
        @WithUser() user: User,
    ): User & Incognito {
        return {
            ...user,
            name: profile.name,
            photo: profile.photo,
            type: profile.type,
            uid: profile.uid,
        };
    }
}
