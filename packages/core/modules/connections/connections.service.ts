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

        const { profile, user } = connection;
        const isConnected = this.isConnected(profile, user);

        if (!isConnected.profile) this.emit('profile-disconnected', connection);
        if (!isConnected.user) this.emit('user-disconnected', connection);
    }

    getConnectionsOf(profile: Profile|User|number) {
        const isProfile = typeof profile === 'number' ? false : 'ownerId' in profile;
        const id = typeof profile === 'number' ? profile : profile.id;

        const isProfileConnection = (connection: Connection) => {
            return isProfile
                ? connection.profile.id === (profile as Profile).id
                : connection.user.id === id;
        }

        return Array.from(this.connections.values())
            .filter(isProfileConnection);
    }

    on<T extends ConnectionEventType>(type: T, listener: ConnectionEventListener<T>) {
        this.eventEnitter.on(type, listener);
    }

    /** Возвращает список подключенных профилей */
    get connectedProfiles() {
        const profilesMap = Array.from(this.connections.values())
            .reduce<Map<number, Profile>>((map, connection) => {
                return map.set(connection.profile.id, connection.profile);
            }, new Map());
        return Array.from(profilesMap.values());
    }

    /**
     * Возвращает объект, который содержит информацию о том, подключен ли
     * указанный пользователь и указанный профиль.
     */
    private isConnected(profile: Profile, user: User) {
        const userConnections = this.getConnectionsOf(user);
        const profileConnections = userConnections
            .filter((connection) => connection.profile.id === profile.id);

        return {
            profile: profileConnections.length > 0,
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
