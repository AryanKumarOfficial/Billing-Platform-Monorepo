import { InvoiceDto } from './invoice.dto';

export class FindAllInvoicesResponseDto {
    invoices!: InvoiceDto[];
    limit!: number;
    offset!: number;
    total!: number;
}
