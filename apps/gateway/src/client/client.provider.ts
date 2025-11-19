import {
    Inject,
    Injectable,
    Logger,
    OnModuleDestroy,
    ServiceUnavailableException,
} from '@nestjs/common';
import * as Consul from 'consul';
import {
    loadPackageDefinition,
    credentials,
    GrpcObject,
} from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {
    INVOICE_PROTO_PATH,
    INVOICE_SERVICE_NAME,
    USER_PROTO_PATH,
    USER_SERVICE_NAME,
    USER_PACKAGE_NAME,
    INVOICE_PACKAGE_NAME,
} from '@app/proto';

interface GrpcServiceClient {
    [key: string]: Function;
}

@Injectable()
export class ClientProvider implements OnModuleDestroy {
    private readonly logger = new Logger(ClientProvider.name);
    // Cache for loaded package definitions
    private packageDefs: Map<string, GrpcObject> = new Map();
    // Cache for active clients
    private clients: Map<string, GrpcServiceClient> = new Map();
    // For round-robin load balancing
    private counters: Map<string, number> = new Map();

    constructor(
        @Inject('CONSUL_CLIENT') private readonly consul: Consul.Consul,
    ) {
        // Pre-load package definitions
        this.loadProto(USER_SERVICE_NAME, USER_PROTO_PATH);
        this.loadProto(INVOICE_SERVICE_NAME, INVOICE_PROTO_PATH);
    }

    private loadProto(serviceName: string, protoPath: string) {
        const packageDefinition = protoLoader.loadSync(protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        const proto = loadPackageDefinition(packageDefinition);
        this.packageDefs.set(serviceName, proto);
        this.counters.set(serviceName, 0);
    }

    /**
     * Gets a gRPC client for a service.
     * Handles service discovery and round-robin load balancing.
     */
    async getServiceClient<T extends GrpcServiceClient>(
        serviceName: string,
    ): Promise<T> {
        const serviceInstances = await this.discoverService(serviceName);

        // Bonus: Round-robin load balancing
        const counter = this.counters.get(serviceName) || 0;
        const index = counter % serviceInstances.length;
        this.counters.set(serviceName, counter + 1);

        const instance = serviceInstances[index];
        const address = `${instance.Service.Address}:${instance.Service.Port}`;

        // Cache clients by address to avoid re-creation
        const clientKey = `${serviceName}@${address}`;
        if (this.clients.has(clientKey)) {
            return this.clients.get(clientKey) as T;
        }

        // Create new client
        const proto = this.packageDefs.get(serviceName);
        if (!proto) {
            throw new Error(`No package definition found for ${serviceName}`);
        }

        let ServiceClient: any;
        if (serviceName === USER_SERVICE_NAME) {
            ServiceClient = (proto[USER_PACKAGE_NAME] as any)[USER_SERVICE_NAME];
        } else if (serviceName === INVOICE_SERVICE_NAME) {
            ServiceClient = (proto[INVOICE_PACKAGE_NAME] as any)[
                INVOICE_SERVICE_NAME
                ];
        }

        if (!ServiceClient) {
            throw new Error(`Could not load service client for ${serviceName}`);
        }

        const client = new ServiceClient(address, credentials.createInsecure());
        this.clients.set(clientKey, client);
        this.logger.log(`Created new gRPC client for ${clientKey}`);

        return client as T;
    }

    /**
     * Queries Consul for healthy instances of a service.
     */
    private async discoverService(
        serviceName: string,
    ): Promise<Consul.Health.Service[]> {
        try {
            const healthyInstances = await this.consul.health.service({
                service: serviceName,
                passing: true,
            });

            if (healthyInstances.length === 0) {
                throw new ServiceUnavailableException(
                    `No healthy instances found for service: ${serviceName}`,
                );
            }

            return healthyInstances;
        } catch (error) {
            this.logger.error(
                `Failed to discover service ${serviceName} from Consul`,
                error,
            );
            throw new ServiceUnavailableException(
                `Service discovery failed for: ${serviceName}`,
            );
        }
    }

    onModuleDestroy() {
        this.clients.forEach((client) => {
            // gRPC clients have a 'close' method
            if (typeof client.close === 'function') {
                client.close();
            }
        });
        this.logger.log('Closed all gRPC clients.');
    }
}