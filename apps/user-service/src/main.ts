import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsulService } from '@app/common';
import { USER_PACKAGE_NAME, USER_PROTO_PATH,USER_SERVICE_NAME } from '@app/proto';

async function bootstrap() {
    const logger = new Logger('UserService');
    // Create a context to read config
    const tempApp = await NestFactory.create(AppModule);
    const configService = tempApp.get(ConfigService);
    const consulService = tempApp.get(ConsulService);
    await tempApp.close();

    const port = configService.get<number>('SERVICE_PORT', 50051);
    const address = configService.get<string>('SERVICE_ADDRESS', 'user-service');

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.GRPC,
            options: {
                package: USER_PACKAGE_NAME,
                protoPath: USER_PROTO_PATH,
                url: `0.0.0.0:${port}`,
            },
        },
    );

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableShutdownHooks();

    await app.listen();

    // Register with Consul AFTER the service is listening
    try {
        await consulService.registerService(
            USER_SERVICE_NAME,
            port,
            address,
            ['grpc', 'v1'],
        );
        logger.log(`UserService is listening on port ${port}`);
        logger.log(`Registered with Consul as ${USER_SERVICE_NAME} at ${address}:${port}`);
    } catch (error) {
        logger.error('Failed to register with Consul', error);
        await app.close();
        process.exit(1);
    }
}
bootstrap();