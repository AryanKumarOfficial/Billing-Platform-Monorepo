import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InvoiceService } from './invoice.service';
import { INVOICE_SERVICE_NAME } from '@app/proto';

@Controller()
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    @GrpcMethod(INVOICE_SERVICE_NAME, 'FindOne')
    findOne(data: { id: string }) {
        return this.invoiceService.findOne(data);
    }

    @GrpcMethod(INVOICE_SERVICE_NAME, 'FindAll')
    findAll(data: { limit?: number; offset?: number }) {
        return this.invoiceService.findAll(data);
    }

    @GrpcMethod(INVOICE_SERVICE_NAME, 'FindAllByUser')
    findAllByUser(data: {
        userId: string;
        pagination: { limit?: number; offset?: number };
    }) {
        return this.invoiceService.findAllByUser(data);
    }

    @GrpcMethod(INVOICE_SERVICE_NAME, 'Create')
    create(data: { userId: string; description: string; amount: number }) {
        return this.invoiceService.create(data);
    }
}