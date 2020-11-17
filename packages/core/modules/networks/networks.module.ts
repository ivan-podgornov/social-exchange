import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworksService } from './networks.service';
import { UsersModule } from '../users/users.module';
import { Network } from './network.entity';

@Module({
    exports: [TypeOrmModule, NetworksService],
    providers: [NetworksService],
    imports: [
        TypeOrmModule.forFeature([Network]),
        UsersModule,
    ],
})
export class NetworksModule {};
