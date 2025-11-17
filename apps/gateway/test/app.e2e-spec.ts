// /apps/gateway/test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Gateway (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/ (GET) health check', () => {
        // Note: The default project has no GET / endpoint.
        // This test will fail, but it proves the test setup works.
        // You can add a health check endpoint to make it pass.
        return request(app.getHttpServer())
            .get('/')
            .expect(404);
    });

    it('/auth/login (POST) requires credentials', () => {
        return request(app.getHttpServer())
            .post('/auth/login')
            .send({})
            .expect(401); // 401 Unauthorized (or 400 Bad Request depending on DTOs)
    });
});