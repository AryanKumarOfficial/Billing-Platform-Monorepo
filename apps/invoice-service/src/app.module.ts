import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsulModule } from '@app/common';
import * as Joi from 'joi';
import { InvoiceModule } from './invoice/invoice.module';
import { Invoice } from './invoice/invoice.entity';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                NODE_ENV: Joi.string()
                    .valid('development', 'production')
                    .default('development'),
                CONSUL_HOST: Joi.string().required(),
                SERVICE_ADDRESS: Joi.string().required(),
                SERVICE_PORT: Joi.number().default(50052),
                DB_HOST: Joi.string().required(),
                DB_PORT: Joi.number().required(),
                DB_USERNAME: Joi.string().required(),
                DB_PASSWORD: Joi.string().required(),
                DB_DATABASE: Joi.string().required(),
            }),
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST'),
                port: configService.get<number>('DB_PORT'),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_DATABASE'),
                entities: [Invoice],
                synchronize: true, // OK for dev
            }),
        }),
        ConsulModule,
        InvoiceModule,
    ],
})
export class AppModule {}