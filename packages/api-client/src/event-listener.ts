import io, { Socket } from 'socket.io-client';
import { EventTypes, EventListener } from './events';

type ClientOptions = {
    baseURL?: string,
    token?: string,
};

export class ApiEventListener {
    private readonly baseURL: string;
    private readonly token: string;
    private readonly socket: typeof Socket;

    constructor(options: ClientOptions) {
        this.baseURL = options.baseURL || 'https://api.sealikes.com';
        this.token = options.token || '';
        this.socket = this.listenEvents();
    }

    on<T extends EventTypes>(type: T, listener: EventListener<T>) {
        this.socket.on(type, listener);
    }

    private listenEvents() {
        return io(this.baseURL, {
            transports: ['websocket'],
            query: { token: this.token },
        });
    }
}
