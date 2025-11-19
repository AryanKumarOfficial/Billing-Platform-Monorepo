import { Injectable } from '@nestjs/common';
import { ClientProvider } from '../client/client.provider';
import { INVOICE_SERVICE_NAME } from '@app/proto';
import { InvoiceDto } from './dto/invoice.dto';
import { FindAllInvoicesResponseDto } from './dto/find-all-invoices.dto';

interface InvoiceServiceClient {
    [key: string]: any;
    findAll?: (
        query: { limit: number; offset: number }
    ) => Promise<{ invoices: any[]; total?: number }>;
}

@Injectable()
export class InvoiceService {
    constructor(private readonly clientProvider: ClientProvider) {}

    async findAll(pagination: {
        limit: number;
        offset: number;
    }): Promise<FindAllInvoicesResponseDto> {
        const client =
            await this.clientProvider.getServiceClient<InvoiceServiceClient>(
                INVOICE_SERVICE_NAME,
            );

        const resp = await client.findAll!(pagination);

        const rawInvoices = Array.isArray(resp?.invoices) ? resp.invoices : [];

        const invoices: InvoiceDto[] = rawInvoices.map((inv) => ({
            id: inv.id ?? '',
            userId: inv.userId ?? inv.user_id ?? '',
            description: inv.description ?? '',
            amount: inv.amount ?? 0,
            status: inv.status ?? '',
            createdAt: inv.createdAt ?? '',
        }));

        return {
            invoices,
            limit: pagination.limit,
            offset: pagination.offset,
            total: typeof resp?.total === 'number' ? resp.total : invoices.length,
        };
    }
}
