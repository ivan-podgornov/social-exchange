import { User, Incognito } from '@social-exchange/types';

export type Users = {
    get(): User & Incognito,
};
