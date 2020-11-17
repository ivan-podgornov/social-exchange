import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { NetworksModule } from '../networks/networks.module';
import { UsersModule } from '../users/users.module';
import { jwtOptions } from './jwt-options';

@Module({
    controllers: [AuthController],
    exports: [JwtStrategy],
    providers: [AuthService, JwtStrategy],
    imports: [
        NetworksModule,
        UsersModule,
        JwtModule.register(jwtOptions),
    ],
})
export class AuthModule {};
