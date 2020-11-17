import { Incognito } from './profile';
import { User } from './user';

export type JwtPayload = Pick<User, 'id'> & Omit<Incognito, 'photo'>;
