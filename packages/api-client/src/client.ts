import fetch from 'cross-fetch';
import qs from 'qs';
import { HttpError } from './errors/http-error';
import { ValidationError } from './errors/validation-error';
import { Endpoints, Methods } from './endpoints';
import type { Options, ErrorResponse, Response } from './types';

type ClientOptions = {
    baseURL?: string,
    token?: string,
};

export { Endpoints, Methods, endpoints } from './endpoints';
export { Options, Response } from './types';

export class ApiClient {
    async call<E extends keyof Endpoints, M extends Methods<E>>(
        endpoint: E,
        method: M,
        options: ClientOptions,
        params?: Options<E, M>,
    ): Promise<Response<E, M>> {
        const url = this.getUrl(endpoint, method, params);
        const baseURL = options.baseURL || 'https://api.sealikes.com';
        const response = await fetch(`${baseURL}${url}`, {
            body: method === 'get' ? null : JSON.stringify(params),
            method: method as 'get'|'post'|'delete'|'patch'|'put',
            headers: {
                'authorization': `Bearer ${options.token || ''}`,
                'content-type': 'application/json',
            },
        });

        if (!response.ok) throw new HttpError(response.statusText, response.status);

        const body = await response.json();
        if ('status' in body && body.status === 'error') this.resolveErrorResponse(body);

        return body as Response<E, M>;
    }

    private getUrl<E extends keyof Endpoints, M extends Methods<E>>(
        endpoint: E,
        method: M,
        params?: Options<E, M>,
    ) {
        type UriParamContainer = { uriParam: number|string };
        const param = params && 'uriParam' in params
            ? (params as UriParamContainer).uriParam : '';
        const query = method === 'get' ? qs.stringify(params) : '';
        return `/${endpoint}/${param}?${query}`;
    }

    private resolveErrorResponse(response: ErrorResponse<string>) {
        const error = response.name === 'ValidationError'
            ? new ValidationError(response.errors)
            : new Error(response.message);

        throw error;
    }
}
