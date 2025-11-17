import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { ClientModule } from '../client/client.module';

@Module({
    imports: [ClientModule],
    providers: [InvoiceService],
    controllers: [InvoiceController],
})
export class InvoiceModule {}