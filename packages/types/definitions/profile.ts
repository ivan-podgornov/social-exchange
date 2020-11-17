import { NetworkType } from './network';
import { User } from './user';

export type Profile = {
    id: number,
    name: string,
    owner: Pick<User, 'id'|'balance'>,
    ownerId: number,
    photo: string,
    type: NetworkType,
    /** id пользователя в социальной сети */
    uid: number,
};

export type Incognito = Omit<Profile, 'id'|'owner'|'ownerId'>;
