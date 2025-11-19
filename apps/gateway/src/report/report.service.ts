import { Injectable, Logger } from '@nestjs/common';
import { ClientProvider } from '../client/client.provider';
import { INVOICE_SERVICE_NAME, USER_SERVICE_NAME } from '@app/proto';
import { firstValueFrom } from 'rxjs';

/**
 * Local DTOs for service responses.
 * Note: we include an index signature on the client interfaces so they
 * satisfy broad GrpcServiceClient constraints used elsewhere in the codebase.
 */
interface PaginationQuery {
    limit: number;
    offset: number;
}

interface Invoice {
    id: string;
    // some services use snake_case, some camelCase
    user_id?: string;
    userId?: string;
    description?: string;
    amount?: number;
    status?: string;
    createdAt?: string;
    [key: string]: any;
}

interface User {
    id: string;
    email?: string;
    name?: string;
    [key: string]: any;
}

/** Add index signature to satisfy generic constraints on your client provider */
interface InvoiceServiceClient {
    [key: string]: any;
    findAll?: (query: PaginationQuery) => Promise<{ invoices: Invoice[]; total?: number }>;
    ListInvoices?: (query: PaginationQuery) => Promise<{ invoices: Invoice[]; total?: number }>;
    listInvoices?: (query: PaginationQuery) => Promise<{ invoices: Invoice[]; total?: number }>;
}

interface UserServiceClient {
    [key: string]: any;
    findByIds?: (data: { ids: string[] }) => Promise<{ users: User[] }>;
    FindByIds?: (data: { ids: string[] }) => Promise<{ users: User[] }>;
    listUsersByIds?: (data: { ids: string[] }) => Promise<{ users: User[] }>;
}

@Injectable()
export class ReportService {
    private readonly logger = new Logger(ReportService.name);

    constructor(private readonly clientProvider: ClientProvider) {}

    /**
     * Small helper that attempts to call a method on a gRPC client and
     * supports:
     *  - Promise-returning methods
     *  - Observable-returning methods (firstValueFrom)
     *  - callback-style methods (fn(payload, cb))
     */
    private async callGrpc<T = any>(
        client: any,
        candidateMethodNames: string[],
        payload: any,
    ): Promise<T> {
        for (const name of candidateMethodNames) {
            const fn = client && client[name];
            if (!fn) continue;

            // If it's a function, try calling it:
            try {
                const result = fn.call(client, payload);

                // Promise
                if (result && typeof result.then === 'function') {
                    return (await result) as T;
                }

                // Observable (RxJS)
                if (result && typeof result.subscribe === 'function') {
                    return (await firstValueFrom(result)) as T;
                }

                // Callback-style (fn(payload, cb))
                // We detect by function length (>=2) but we fall back to using the callback wrapper.
                return await new Promise<T>((resolve, reject) => {
                    try {
                        fn.call(client, payload, (err: any, res: any) => {
                            if (err) return reject(err);
                            resolve(res);
                        });
                    } catch (err) {
                        reject(err);
                    }
                });
            } catch (err) {
                // If the method threw synchronously, try the next candidate
                throw err;
            }
        }

        throw new Error(`No callable method found on client (candidates: ${candidateMethodNames.join(', ')})`);
    }

    /**
     * Public report generator that fetches invoices and enriches them with user info.
     */
    async getUserInvoicesReport(pagination: PaginationQuery) {
        this.logger.log('Generating user-invoices report...');

        // Default pagination safety
        const limit = Math.max(1, pagination?.limit ?? 10);
        const offset = Math.max(0, pagination?.offset ?? 0);

        // 1) Get invoice client
        const invoiceClient = await this.clientProvider.getServiceClient<InvoiceServiceClient>(
            INVOICE_SERVICE_NAME,
        );

        // Candidate method names for invoice list
        const invoiceMethods = ['findAll', 'ListInvoices', 'listInvoices', 'list'];

        let invoices: Invoice[] = [];
        let total = 0;

        try {
            const invResp: any = await this.callGrpc<{ invoices: Invoice[]; total?: number }>(
                invoiceClient,
                invoiceMethods,
                { limit, offset },
            );

            invoices = Array.isArray(invResp?.invoices) ? invResp.invoices : [];
            total = typeof invResp?.total === 'number' ? invResp.total : invoices.length;
        } catch (err) {
            this.logger.error('Failed to fetch invoices', err as any);
            // bubble up or return empty depending on your error policy; here we return empty result
            return { data: [], total: 0, limit, offset };
        }

        if (invoices.length === 0) {
            return { data: [], total, limit, offset };
        }

        // 2) Extract unique user IDs (handle both userId and user_id)
        const userIds = Array.from(
            new Set(
                invoices.map((inv) => (inv.userId || inv.user_id) as string).filter(Boolean),
            ),
        );

        if (userIds.length === 0) {
            // No user ids to fetch
            const combinedResults = invoices.map((invoice) => ({ ...invoice, user: null }));
            return { data: combinedResults, total, limit, offset };
        }

        // 3) Get user client and batch fetch users
        const userClient = await this.clientProvider.getServiceClient<UserServiceClient>(
            USER_SERVICE_NAME,
        );

        const userMethods = ['findByIds', 'FindByIds', 'listUsersByIds', 'findUsersByIds'];

        let users: User[] = [];
        try {
            const uResp: any = await this.callGrpc<{ users: User[] }>(userClient, userMethods, {
                ids: userIds,
            });
            users = Array.isArray(uResp?.users) ? uResp.users : [];
        } catch (err) {
            this.logger.warn('Failed to fetch users for report; proceeding with null users', err as any);
            users = [];
        }

        // 4) Build map and combine
        const userMap = new Map(users.map((u) => [u.id, u]));

        const combinedResults = invoices.map((invoice) => {
            const uid = (invoice.userId || invoice.user_id) as string;
            return { ...invoice, user: userMap.get(uid) ?? null };
        });

        return {
            data: combinedResults,
            total,
            offset,
            limit,
        };
    }
}
