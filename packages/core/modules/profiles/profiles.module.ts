import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { UsersModule } from '../users/users.module';
import { ProfileEntity } from './profile.entity';

@Module({
    exports: [TypeOrmModule, ProfilesService],
    providers: [ProfilesService],
    imports: [
        TypeOrmModule.forFeature([ProfileEntity]),
        UsersModule,
    ],
})
export class ProfilesModule {};
