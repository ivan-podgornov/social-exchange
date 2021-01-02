import { NetworkType } from './network';
import { User } from './user';

export type Profile<NT extends NetworkType = NetworkType> = {
    id: number,
    name: string,
    owner: Pick<User, 'id'|'balance'>,
    ownerId: number,
    photo: string,
    type: NT,
    /** id пользователя в социальной сети */
    uid: number,
};

export type Incognito = Omit<Profile, 'id'|'owner'|'ownerId'>;
