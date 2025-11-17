import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Consul from 'consul';
import { ConsulService } from './consul.service';

@Global() // Makes ConsulService available app-wide
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'CONSUL_CLIENT',
            useFactory: (configService: ConfigService) => {
                const host = configService.get<string>('CONSUL_HOST');
                if (!host) {
                    throw new Error('CONSUL_HOST environment variable not set!');
                }
                return new Consul({
                    host: host,
                    port: configService.get<string>('CONSUL_PORT', '8500'),
                    promisify: true,
                });
            },
            inject: [ConfigService],
        },
        ConsulService,
    ],
    exports: ['CONSUL_CLIENT', ConsulService],
})
export class ConsulModule {}