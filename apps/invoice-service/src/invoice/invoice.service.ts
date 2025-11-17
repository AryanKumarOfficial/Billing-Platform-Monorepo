import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

// DTOs
interface PaginationQuery {
    limit?: number;
    offset?: number;
}
interface CreateInvoiceDto {
    userId: string;
    description: string;
    amount: number;
}
interface FindOneInvoiceDto {
    id: string;
}
interface FindAllByUserDto {
    userId: string;
    pagination: PaginationQuery;
}

@Injectable()
export class InvoiceService {
    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
    ) {}

    async findOne(data: FindOneInvoiceDto): Promise<Invoice> {
        const invoice = await this.invoiceRepository.findOneBy({ id: data.id });
        if (!invoice) {
            throw new RpcException({
                code: status.NOT_FOUND,
                message: 'Invoice not found',
            });
        }
        return this.serializeInvoice(invoice);
    }

    async findAll(pagination: PaginationQuery) {
        const { limit = 10, offset = 0 } = pagination;
        const [invoices, total] = await this.invoiceRepository.findAndCount({
            take: limit,
            skip: offset,
            order: { createdAt: 'DESC' },
        });
        return { invoices: invoices.map(this.serializeInvoice) };
    }

    async findAllByUser(data: FindAllByUserDto) {
        const { limit = 10, offset = 0 } = data.pagination || {};
        const [invoices, total] = await this.invoiceRepository.findAndCount({
            where: { userId: data.userId },
            take: limit,
            skip: offset,
            order: { createdAt: 'DESC' },
        });
        return { invoices: invoices.map(this.serializeInvoice) };
    }

    async create(data: CreateInvoiceDto): Promise<Invoice> {
        const invoice = this.invoiceRepository.create(data);
        const saved = await this.invoiceRepository.save(invoice);
        return this.serializeInvoice(saved);
    }

    // gRPC doesn't like Date objects, so we serialize to ISO string
    private serializeInvoice(invoice: Invoice): any {
        return {
            ...invoice,
            createdAt: invoice.createdAt.toISOString(),
        };
    }
}