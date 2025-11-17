import {Inject, Injectable, Logger, OnModuleDestroy} from '@nestjs/common';
import * as Consul from 'consul';

@Injectable()
export class ConsulService implements OnModuleDestroy {
    private readonly logger = new Logger(ConsulService.name);
    private readonly serviceIds: string[] = [];

    constructor(
        @Inject('CONSUL_CLIENT') private readonly consul: Consul.Consul,
    ) {
    }

    async registerService(
        name: string,
        port: number,
        address: string,
        tags: string[] = [],
    ) {
        const serviceId = `${name}-${address}-${port}`;
        const registration: Consul.Agent.Service.RegisterOptions = {
            name,
            id: serviceId,
            port,
            address,
            tags,
            check: {
                // In a real app, this would be a health check endpoint (e.g., /health)
                // For gRPC, a gRPC health check is better, but TCP is a good start.
                tcp: `${address}:${port}`,
                interval: '10s',
                timeout: '1s',
                deregistercriticalserviceafter: '1m',
            },
        };

        try {
            await this.consul.agent.service.register(registration);
            this.serviceIds.push(serviceId);
            this.logger.log(`Service registered with Consul: ${serviceId}`);
        } catch (error) {
            this.logger.error(`Failed to register service with Consul`, error);
            throw error;
        }
    }

    async onModuleDestroy() {
        for (const serviceId of this.serviceIds) {
            try {
                await this.consul.agent.service.deregister(serviceId);
                this.logger.log(`Deregistered service from Consul: ${serviceId}`);
            } catch (error) {
                this.logger.error(
                    `Failed to deregister service ${serviceId} from Consul`,
                    error,
                );
            }
        }
    }
}