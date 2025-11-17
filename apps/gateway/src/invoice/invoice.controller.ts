import {
    Controller,
    Get,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@app/common/src';
import { InvoiceService } from './invoice.service';
import { FindAllInvoicesResponseDto } from './dto/find-all-invoices.dto';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    @Get()
    findAll(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    ): Promise<FindAllInvoicesResponseDto> {
        return this.invoiceService.findAll({ limit, offset });
    }
}
