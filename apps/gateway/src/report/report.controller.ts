import {
    Controller,
    Get,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@app/common/src';
import { ReportService } from './report.service';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    @Get('user-invoices')
    getUserInvoices(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    ) {
        return this.reportService.getUserInvoicesReport({ limit, offset });
    }
}