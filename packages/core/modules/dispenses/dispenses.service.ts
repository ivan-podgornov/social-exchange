import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DispenseStatus, Offer, Profile } from '@social-exchange/types';
import type { Repository } from 'typeorm';
import { ConnectionsService } from '../connections/connections.service';
import { EventsService } from '../events/events.service';
import { DispenseEntity } from './dispense.entity';

@Injectable()
export class DispensesService {
    constructor(
        private connections: ConnectionsService,
        private eventsService: EventsService,

        @InjectRepository(DispenseEntity)
        private dispenses: Repository<DispenseEntity>,
    ) {
        this.connections.on('profile-disconnected', (connection) => {
            this.removeProfileDispenses(connection.profile);
        });
    }

    async removeOfferDispenses(offer: Offer) {
        const dispenses = await this.dispenses.find({
            relations: ['recipient'],
            where: {
                offer: { id: offer.id },
            },
        });

        this.dispenses.delete(dispenses.map((dispense) => dispense.id));
        dispenses.forEach((dispense) => {
            this.eventsService.emit('invalidate-dispense', {
                details: { dispenseId: dispense.id },
                important: false,
                read: false,
                recipient: dispense.recipient,
                type: 'invalidate-dispense',
            });
        });
    }

    private async removeProfileDispenses(profile: Profile) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        if (this.connections.getConnectionsOf(profile).length) return;

        this.dispenses.delete({
            recipient: { id: profile.id },
            status: DispenseStatus.active,
        });
    }
}
