import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConnectionsService } from './connections.service';
import { SocketIOGateway } from './socket-io.gateway';

@Module({
    imports: [AuthModule],
    exports: [ConnectionsService],
    providers: [ConnectionsService, SocketIOGateway],
})
export class ConnectionsModule {}
