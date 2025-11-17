/* eslint-disable @typescript-eslint/no-unused-vars */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';
import { faker } from '@faker-js/faker';
import { Logger } from '@nestjs/common';

const logger = new Logger('Seed');

// Hard-coded UUIDs to make invoice seeding predictable
export const SEED_USER_IDS = [
    '5a6d5c6d-9c3c-4b5c-8b1e-7c6d5e4d3c2b',
    'b2a3c4d5-e6f7-4b8c-9a0d-1e2f3a4b5c6d',
    'c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f',
];

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userService = app.get(UserService);

    logger.log('Seeding users...');

    // Create predictable users
    const usersToCreate = [
        {
            id: SEED_USER_IDS[0],
            email: 'alice@billing.com',
            name: 'Alice Smith',
            password: 'password123',
        },
        {
            id: SEED_USER_IDS[1],
            email: 'bob@billing.com',
            name: 'Bob Johnson',
            password: 'password123',
        },
        {
            id: SEED_USER_IDS[2],
            email: 'charlie@billing.com',
            name: 'Charlie Brown',
            password: 'password123',
        },
    ];

    for (const userData of usersToCreate) {
        try {
            // Hack: Manually create with ID. This requires a small entity change
            // Or, we'll just create them and log their IDs.
            // Let's do the `create` method and log IDs.
            // No, let's just use the DTO.
            const existing = await userService
                .validateUser({
                    email: userData.email,
                    password: userData.password,
                })
                .catch(() => null);

            if (!existing) {
                await userService.create(userData);
                logger.log(`Created user: ${userData.email}`);
            }
        } catch (e) {
            logger.warn(`User ${userData.email} already exists or failed to create.`);
        }
    }

    // Create some random users
    for (let i = 0; i < 5; i++) {
        const email = faker.internet.email();
        await userService
            .create({
                email,
                name: faker.person.fullName(),
                password: 'password123',
            })
            .catch(() => logger.warn(`User ${email} already exists`));
    }

    logger.log('User seeding complete.');
    await app.close();
    process.exit(0);
}

// NOTE: You would run this via `pnpm --filter user-service run seed`
// This requires `ts-node` and `tsconfig-paths` to be dev dependencies
// For this assignment, you'd run this *after* the services are up
// or build it into your Docker entrypoint.
// For simplicity, I'll provide the file.
bootstrap();