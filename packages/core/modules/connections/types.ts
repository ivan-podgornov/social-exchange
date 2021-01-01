import { Profile, User } from '@social-exchange/types';

export interface Connection {
    id: string,
    profile: Profile,
    user: User,

    emitEvent: (name: string, payload: object) => void,
};

type ConnectionEvents = {
    'connect': Connection,
    'profile-disconnected': Connection,
    'user-disconnected': Connection,
}

export type ConnectionEventType = keyof ConnectionEvents;
export type ConnectionEventDetails<T extends ConnectionEventType>
    = ConnectionEvents[T];
export type ConnectionEventListener<T extends ConnectionEventType>
    = (details: ConnectionEventDetails<T>) => void;
