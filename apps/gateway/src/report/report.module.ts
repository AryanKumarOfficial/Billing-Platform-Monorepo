import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ClientModule } from '../client/client.module';

@Module({
    imports: [ClientModule],
    providers: [ReportService],
    controllers: [ReportController],
})
export class ReportModule {}