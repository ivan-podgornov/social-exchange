import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectionsService } from '../connections/connections.service';
import { Connection } from '../connections/types';
import { EventEntity } from './event.entity';

import {
    EventTypes,
    ExchangeEvent,
    PublicExchangeEvent,
} from '@social-exchange/types';

@Injectable()
export class EventsService {
    constructor(
        private connectionsService: ConnectionsService,

        @InjectRepository(EventEntity)
        private events: Repository<EventEntity>,
    ) {}

    async emit<T extends EventTypes>(type: T, event: ExchangeEvent<T>) {
        const id = event.important
            ? await this.save(event) : Date.now();
        const connections = this.connectionsService
            .getConnectionsOf(event.recipient);
        const emit = this.getEmitter(connections);
        emit(event, id);
    }

    private async save(event: ExchangeEvent<EventTypes>) {
        const userId = typeof event.recipient === 'number'
            ? event.recipient
            : 'ownerId' in event.recipient ? event.recipient.ownerId : event.recipient.id;
        const toSave = this.events.create({
            details: event.details,
            read: false,
            type: event.type,
            user: { id: userId },
        });

        const saved = await this.events.save(toSave);
        return saved.id;
    }

    /**
     * Возвращает функцию, которая отправит событие всем указанным соединениям
     */
    private getEmitter(connections: Connection[]) {
        return (event: ExchangeEvent<EventTypes>, id: number) => {
            const { details, read, type } = event;
            const publicEvent: PublicExchangeEvent<EventTypes> = {
                details, id, read, type
            };

            connections.forEach((connection) => {
                connection.emitEvent(event.type, publicEvent);
            });
        };
    }
}
