import { Injectable } from '@nestjs/common';
import { ClientProvider } from '../client/client.provider';
import { INVOICE_SERVICE_NAME } from '@app/proto/src';

interface Invoice {
    /* ... */
}
interface InvoiceServiceClient {
    [key: string]: Function;
    findAll: (query: {
        limit: number;
        offset: number;
    }) => Promise<{ invoices: Invoice[] }>;
}

@Injectable()
export class InvoiceService {
    constructor(private readonly clientProvider: ClientProvider) {}

    async findAll(pagination: { limit: number; offset: number }) {
        const invoiceService =
            await this.clientProvider.getServiceClient<InvoiceServiceClient>(
                INVOICE_SERVICE_NAME,
            );
        return invoiceService.findAll(pagination);
    }
}