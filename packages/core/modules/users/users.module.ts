import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    controllers: [UsersController],
    imports: [TypeOrmModule.forFeature([UserEntity])],
    providers: [UsersService],
    exports: [TypeOrmModule, UsersService],
})
export class UsersModule {};
