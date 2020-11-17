import jwtDecode from 'jwt-decode';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '@social-exchange/types';
import { Socket } from 'socket.io';
import { JwtStrategy } from '../auth/jwt.strategy';
import { ConnectionsService } from './connections.service';
import { Connection } from './types';

import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
} from '@nestjs/websockets';

@Injectable()
@WebSocketGateway()
export class SocketIOGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private connectionsService: ConnectionsService,
        private jwtStrategy: JwtStrategy,
    ) {}

    async handleConnection(socket: Socket) {
        try {
            const { network, user } = await this.auth(socket);
            const connection: Connection = {
                network,
                user,
                id: socket.id,
                emitEvent: socket.emit.bind(socket),
            };

            this.connectionsService.add(connection);
        } catch (error) {
            socket.disconnect(true);
        }
    }

    async handleDisconnect(socket: Socket) {
        this.connectionsService.remove(socket.id);
    }

    private auth(socket: Socket) {
        const token = socket.handshake.query.token as string|undefined;
        if (typeof token === 'undefined') throw new Error('не указан token');
        const payload: JwtPayload = jwtDecode(token);
        return this.jwtStrategy.validate(payload);
    }
}
