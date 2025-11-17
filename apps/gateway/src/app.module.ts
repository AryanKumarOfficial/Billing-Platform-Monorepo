import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsulModule } from '@app/common/src';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';
import { UserModule } from './user/user.module';
import { InvoiceModule } from './invoice/invoice.module';
import { ReportModule } from './report/report.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                NODE_ENV: Joi.string()
                    .valid('development', 'production')
                    .default('development'),
                CONSUL_HOST: Joi.string().required(),
                PORT: Joi.number().default(3000),
                JWT_SECRET: Joi.string().required(),
                JWT_EXPIRES_IN: Joi.string().default('3600s'),
            }),
        }),
        ConsulModule,
        ClientModule,
        AuthModule,
        UserModule,
        InvoiceModule,
        ReportModule,
    ],
})
export class AppModule {}