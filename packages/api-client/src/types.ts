import { Endpoints, Methods } from './endpoints';
export type Options<
    E extends keyof Endpoints,
    M extends Methods<E>,
> = Endpoints[E][M] extends (...args: any) => any
    ? Parameters<Endpoints[E][M]>[0]
    : undefined;

type ErrorsMap = { [key: string]: string };
export type ErrorResponse<Name extends 'ValidationError'|string> = {
    status: 'error',
    name: 'ValidationError'|'Error',
    message: string,
    errors: Name extends 'ValidationError' ? ErrorsMap : never;
};

export type Response<
    E extends keyof Endpoints,
    M extends Methods<E>,
> = Endpoints[E][M] extends (...args: any) => any
    ? ReturnType<Endpoints[E][M]>
    : never;
