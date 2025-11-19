import {Injectable, Logger} from '@nestjs/common';
import {ClientProvider} from '../client/client.provider';
import {INVOICE_SERVICE_NAME, USER_SERVICE_NAME} from '@app/proto';

/**
 * Local DTOs for service responses.
 */
export interface PaginationQuery {
    limit: number;
    offset: number;
}

export interface Invoice {
    id: string;
    user_id?: string;
    userId?: string;
    description?: string;
    amount?: number;
    status?: string;
    createdAt?: string;

    [key: string]: any;
}

export interface User {
    id: string;
    email?: string;
    name?: string;

    [key: string]: any;
}

export interface InvoiceServiceClient {
    [key: string]: any;
}

export interface UserServiceClient {
    [key: string]: any;
}

@Injectable()
export class ReportService {
    private readonly logger = new Logger(ReportService.name);

    constructor(private readonly clientProvider: ClientProvider) {
    }

    /**
     * Helper to call a gRPC method with a callback, wrapped in a Promise.
     * It searches for the first available method name from the list.
     */
    private async callGrpc<T = any>(
        client: any,
        candidateMethodNames: string[],
        payload: any,
    ): Promise<T> {
        // 1. Find the first method name that actually exists on the client
        const methodName = candidateMethodNames.find(
            (name) => typeof client[name] === 'function',
        );

        if (!methodName) {
            throw new Error(
                `No callable method found on client (candidates: ${candidateMethodNames.join(', ')})`,
            );
        }

        const fn = client[methodName];

        // 2. Call it using the standard Node.js callback pattern
        return new Promise<T>((resolve, reject) => {
            fn.call(client, payload, (err: any, res: any) => {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }

    /**
     * Public report generator that fetches invoices and enriches them with user info.
     */
    async getUserInvoicesReport(pagination: PaginationQuery) {
        this.logger.log('Generating user-invoices report...');

        const limit = Math.max(1, pagination?.limit ?? 10);
        const offset = Math.max(0, pagination?.offset ?? 0);

        // 1) Get invoice client
        const invoiceClient =
            await this.clientProvider.getServiceClient<InvoiceServiceClient>(
                INVOICE_SERVICE_NAME,
            );

        // Try both casing styles
        const invoiceMethods = ['FindAll', 'findAll', 'ListInvoices'];

        let invoices: Invoice[] = [];
        let total = 0;

        try {
            const invResp: any = await this.callGrpc<{
                invoices: Invoice[];
                total?: number;
            }>(invoiceClient, invoiceMethods, {limit, offset});

            invoices = Array.isArray(invResp?.invoices)
                ? invResp.invoices
                : [];
            total =
                typeof invResp?.total === 'number'
                    ? invResp.total
                    : invoices.length;
        } catch (err) {
            this.logger.error('Failed to fetch invoices', err as any);
            return {data: [], total: 0, limit, offset};
        }

        if (invoices.length === 0) {
            return {data: [], total, limit, offset};
        }

        // 2) Extract unique user IDs
        const userIds = Array.from(
            new Set(
                invoices
                    .map((inv) => (inv.userId || inv.user_id) as string)
                    .filter(Boolean),
            ),
        );

        if (userIds.length === 0) {
            const combinedResults = invoices.map((invoice) => ({
                ...invoice,
                user: null,
            }));
            return {data: combinedResults, total, limit, offset};
        }

        // 3) Get user client and batch fetch users
        const userClient =
            await this.clientProvider.getServiceClient<UserServiceClient>(
                USER_SERVICE_NAME,
            );

        const userMethods = [
            'FindByIds',
            'findByIds',
            'listUsersByIds',
            'findUsersByIds',
        ];

        let users: User[] = [];
        try {
            const uResp: any = await this.callGrpc<{ users: User[] }>(
                userClient,
                userMethods,
                {
                    ids: userIds,
                },
            );
            users = Array.isArray(uResp?.users) ? uResp.users : [];
        } catch (err) {
            this.logger.warn(
                'Failed to fetch users for report; proceeding with null users',
                err as any,
            );
            users = [];
        }

        // 4) Build map and combine
        const userMap = new Map(users.map((u) => [u.id, u]));

        const combinedResults = invoices.map((invoice) => {
            const uid = (invoice.userId || invoice.user_id) as string;
            return {...invoice, user: userMap.get(uid) ?? null};
        });

        return {
            data: combinedResults,
            total,
            offset,
            limit,
        };
    }
}