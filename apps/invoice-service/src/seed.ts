import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InvoiceService } from './invoice/invoice.service';
import { faker } from '@faker-js/faker';
import { Logger } from '@nestjs/common';

const logger = new Logger('Seed');

// These MUST match the hard-coded UUIDs in the user-service seeder
const SEED_USER_IDS = [
    '5a6d5c6d-9c3c-4b5c-8b1e-7c6d5e4d3c2b', // Alice
    'b2a3c4d5-e6f7-4b8c-9a0d-1e2f3a4b5c6d', // Bob
    'c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f', // Charlie
];

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const invoiceService = app.get(InvoiceService);

    logger.log('Seeding 50 invoices...');

    for (let i = 0; i < 50; i++) {
        const userId = SEED_USER_IDS[i % SEED_USER_IDS.length]; // Distribute invoices
        await invoiceService.create({
            userId,
            description: faker.finance.transactionDescription(),
            amount: parseInt(faker.finance.amount(1000, 50000, 0)), // $10.00 to $500.00
        });
    }

    logger.log('Invoice seeding complete.');
    await app.close();
    process.exit(0);
}

// Run this *after* the user-service seeder
bootstrap();