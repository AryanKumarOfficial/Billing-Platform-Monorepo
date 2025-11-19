import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsulService } from '@app/common';
import { INVOICE_PACKAGE_NAME, INVOICE_PROTO_PATH } from '@app/proto';

async function bootstrap() {
    const logger = new Logger('InvoiceService');
    // Create a context to read config
    const tempApp = await NestFactory.create(AppModule);
    const configService = tempApp.get(ConfigService);
    const consulService = tempApp.get(ConsulService);
    await tempApp.close();

    const port = configService.get<number>('SERVICE_PORT', 50052);
    const address = configService.get<string>(
        'SERVICE_ADDRESS',
        'invoice-service',
    );

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.GRPC,
            options: {
                package: INVOICE_PACKAGE_NAME,
                protoPath: INVOICE_PROTO_PATH,
                url: `0.0.0.0:${port}`,
            },
        },
    );

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableShutdownHooks(); // For Consul deregistration

    await app.listen();

    // Register with Consul AFTER the service is listening
    try {
        await consulService.registerService(
            'invoice-service',
            port,
            address,
            ['grpc', 'v1'],
        );
        logger.log(`InvoiceService is listening on port ${port}`);
        logger.log(
            `Registered with Consul as 'invoice-service' at ${address}:${port}`,
        );
    } catch (error) {
        logger.error('Failed to register with Consul', error);
        await app.close();
        process.exit(1);
    }
}
bootstrap();