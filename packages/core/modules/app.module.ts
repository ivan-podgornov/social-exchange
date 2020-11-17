import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { ConnectionsModule } from './connections/connections.module';
import { DispensesModule } from './dispenses/dispenses.module';
import { ExecutionsModule } from './executions/executions.module';
import { OffersModule } from './offers/offers.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            autoLoadEntities: true,
            database: process.env.DATABASE_NAME,
            entities: ['dist/modules/**/*.entity.ts'],
            host: process.env.DATABASE_HOST,
            logging: process.env.DEBUG_SQL === 'yes',
            password: process.env.DATABASE_PASSWORD,
            port: parseInt(process.env.DATABASE_PORT || '3306', 10),
            username: process.env.DATABASE_USERNAME,
            synchronize: true,
            type: 'mysql',
        }),
        ScheduleModule.forRoot(),
        AuthModule,
        ConnectionsModule,
        DispensesModule,
        ExecutionsModule,
        OffersModule,
        PaymentsModule,
    ],
})
export class AppModule {}
