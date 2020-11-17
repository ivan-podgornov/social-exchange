import { Dispenses } from './dispenses';
import { Events } from './events';
import { Executions } from './executions';
import { Offers } from './offers';
import { Users } from './users';

export type Endpoints = {
    dispenses: Dispenses,
    events: Events,
    executions: Executions,
    offers: Offers,
    users: Users,
};

export type Methods<E extends keyof Endpoints> = keyof Endpoints[E];

type EndpointsMethods = {
    [key in keyof Endpoints]: Array<Methods<key>>
};

export const endpoints: EndpointsMethods = {
    dispenses: ['get'],
    events: ['put'],
    executions: ['post'],
    offers: ['get', 'post', 'put', 'delete'],
    users: ['get'],
};
