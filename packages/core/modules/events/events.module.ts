import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsModule } from '../connections/connections.module';
import { EventEntity } from './event.entity';
import { EventsService } from './events.service';

@Module({
    exports: [EventsService],
    providers: [EventsService],
    imports: [
        TypeOrmModule.forFeature([EventEntity]),
        ConnectionsModule,
    ],
})
export class EventsModule {}
