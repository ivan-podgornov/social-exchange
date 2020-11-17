import { EventEmitter } from 'events';
import { Injectable } from '@nestjs/common';
import { Profile, User } from '@social-exchange/types';

import {
    Connection,
    ConnectionEventDetails,
    ConnectionEventListener,
    ConnectionEventType,
} from './types';

@Injectable()
export class ConnectionsService {
    private connections: Map<string, Connection> = new Map();
    private eventEnitter = new EventEmitter();

    add(connection: Connection) {
        this.connections.set(connection.id, connection);
        this.emit('connect', connection);
    }

    remove(connectionId: string) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        this.connections.delete(connection.id);

        const { network, user } = connection;
        const isConnected = this.isConnected(network, user);

        if (!isConnected.network) this.emit('profile-disconnected', connection);
        if (!isConnected.user) this.emit('user-disconnected', connection);
    }

    getConnectionsOf(profile: Profile|User) {
        const isNetwork = 'ownerId' in profile;
        const isProfileConnection = (connection: Connection) => {
            return isNetwork
                ? connection.network.id === profile.id
                : connection.user.id === profile.id;
        }

        return Array.from(this.connections.values())
            .filter(isProfileConnection);
    }

    on<T extends ConnectionEventType>(type: T, listener: ConnectionEventListener<T>) {
        this.eventEnitter.on(type, listener);
    }

    /** Возвращает список подключенных профилей */
    get connectedNetworks() {
        const networksMap = Array.from(this.connections.values())
            .reduce<Map<number, Profile>>((map, connection) => {
                return map.set(connection.network.id, connection.network);
            }, new Map());
        return Array.from(networksMap.values());
    }

    /**
     * Возвращает объект, который содержит информацию о том, подключен ли
     * указанный пользователь и указанный профиль.
     */
    private isConnected(network: Profile, user: User) {
        const userConnections = this.getConnectionsOf(user);
        const networkConnections = userConnections
            .filter((connection) => connection.network.id === network.id);

        return {
            network: networkConnections.length > 0,
            user: userConnections.length > 0,
        };
    }

    /** Порождает указанное событие */
    private emit<T extends ConnectionEventType>(
        type: T,
        details: ConnectionEventDetails<T>,
    ) {
        this.eventEnitter.emit(type, details);
    }
}
