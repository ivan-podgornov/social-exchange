import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { PaymentsController } from './payments.controller';
import { PaymentEntity } from './payment.entity';
import { PaymentsService } from './payments.service';

@Module({
    controllers: [PaymentsController],
    providers: [PaymentsService],
    imports: [
        TypeOrmModule.forFeature([PaymentEntity]),
        UsersModule,
    ],
})
export class PaymentsModule {}
