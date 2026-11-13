import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { existsSync, unlinkSync } from 'node:fs';
import { AppModule } from '../src/app.module';
import { ProblemDetailExceptionFilter } from '../src/shared/infrastructure/filters/problem-detail-exception.filter';

describe('SaaS-O-Matic E2E Integration Suite', () => {
  let app: INestApplication;
  let createdCustomerEsId: string;
  let createdCustomerDeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new ProblemDetailExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    const filesToClean = [
      'saas_o_matic.test.sqlite',
      'saas_o_matic.test.sqlite-wal',
      'saas_o_matic.test.sqlite-shm',
    ];
    for (const file of filesToClean) {
      if (existsSync(file)) {
        try {
          unlinkSync(file);
        } catch {
          // ignore
        }
      }
    }
  });

  describe('Customers API (/customers)', () => {
    it('POST /customers - should register a new Spanish corporate customer with valid CIF', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .send({
          companyName: 'Roams Corp S.L.',
          taxId: 'B-12345674',
          email: 'finance@roams.es',
          country: 'ES',
          selectedPlan: 'Enterprise Scale',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.companyName).toBe('Roams Corp S.L.');
      expect(response.body.taxId).toBe('B12345674');
      expect(response.body.email).toBe('finance@roams.es');
      expect(response.body.country).toBe('ES');
      expect(response.body.selectedPlan).toBe('Enterprise Scale');
      expect(response.body).toHaveProperty('createdAt');

      createdCustomerEsId = response.body.id;
    });

    it('POST /customers - should reject invalid Spanish fiscal ID with 400 and RFC 7807 problem details', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .send({
          companyName: 'Fraudulent S.L.',
          taxId: 'B1234567X',
          email: 'fake@fraud.es',
          country: 'ES',
          selectedPlan: 'Basic',
        })
        .expect(400);

      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(response.body.type).toBe('https://errors.saas-o-matic.com/400');
      expect(response.body.title).toBe('Bad Request');
      expect(response.body.status).toBe(400);
      expect(response.body.detail).toContain("Invalid tax identifier 'B1234567X' for country 'ES'");
      expect(response.body.instance).toBe('/customers');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('POST /customers - should reject duplicate taxId with 409 Conflict in RFC 7807', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .send({
          companyName: 'Duplicate Roams',
          taxId: 'b 12345674',
          email: 'dup@roams.es',
          country: 'ES',
          selectedPlan: 'Pro',
        })
        .expect(409);

      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(response.body.type).toBe('https://errors.saas-o-matic.com/409');
      expect(response.body.status).toBe(409);
      expect(response.body.detail).toContain('already registered');
    });

    it('GET /customers - should search customers by company name', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?search=roams')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].companyName).toBe('Roams Corp S.L.');
    });

    it('GET /customers - should search customers by taxId even with hyphens', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?search=b-1234')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].taxId).toBe('B12345674');
    });

    it('GET /customers/:id - should return single customer detail by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/customers/${createdCustomerEsId}`)
        .expect(200);

      expect(response.body.id).toBe(createdCustomerEsId);
      expect(response.body.companyName).toBe('Roams Corp S.L.');
    });

    it('GET /customers/:id - should return 404 with RFC 7807 for non-existent customer', async () => {
      const fakeUuid = 'a0000000-0000-4000-8000-000000000000';
      const response = await request(app.getHttpServer())
        .get(`/customers/${fakeUuid}`)
        .expect(404);

      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(response.body.type).toBe('https://errors.saas-o-matic.com/404');
      expect(response.body.status).toBe(404);
      expect(response.body.detail).toContain(`Customer with id '${fakeUuid}' was not found.`);
    });
  });

  describe('Simulations API (/simulations)', () => {
    it('POST /simulations - should calculate and persist tiered pricing and Spanish tax for 15 users', async () => {
      const response = await request(app.getHttpServer())
        .post('/simulations')
        .send({
          customerId: createdCustomerEsId,
          activeUsers: 15,
          storageGb: 100,
          apiCalls: 50000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.customerId).toBe(createdCustomerEsId);
      expect(response.body.activeUsers).toBe(15);
      expect(response.body.storageGb).toBe(100);
      expect(response.body.apiCalls).toBe(50000);
      expect(response.body.monthlyBaseCost).toBe(140);
      expect(response.body.taxRate).toBe(0.21);
      expect(response.body.taxAmount).toBe(29.4);
      expect(response.body.totalCost).toBe(169.4);
      expect(response.body.currency).toBe('EUR');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('POST /simulations - should calculate tiered pricing for German customer (19% VAT) with 60 users', async () => {
      const custRes = await request(app.getHttpServer())
        .post('/customers')
        .send({
          companyName: 'Berlin Cloud GmbH',
          taxId: 'DE999888777',
          email: 'billing@berlincloud.de',
          country: 'DE',
          selectedPlan: 'Growth',
        })
        .expect(201);

      createdCustomerDeId = custRes.body.id;

      const response = await request(app.getHttpServer())
        .post('/simulations')
        .send({
          customerId: createdCustomerDeId,
          activeUsers: 60,
          storageGb: 250.5,
          apiCalls: 100000,
        })
        .expect(201);

      expect(response.body.monthlyBaseCost).toBe(470);
      expect(response.body.taxRate).toBe(0.19);
      expect(response.body.taxAmount).toBe(89.3);
      expect(response.body.totalCost).toBe(559.3);
      expect(response.body.currency).toBe('EUR');
    });

    it('POST /simulations - should return 404 with RFC 7807 when customer does not exist', async () => {
      const fakeUuid = 'b0000000-0000-4000-8000-000000000000';
      const response = await request(app.getHttpServer())
        .post('/simulations')
        .send({
          customerId: fakeUuid,
          activeUsers: 10,
          storageGb: 10,
          apiCalls: 1000,
        })
        .expect(404);

      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(response.body.type).toBe('https://errors.saas-o-matic.com/404');
      expect(response.body.status).toBe(404);
      expect(response.body.detail).toContain(`Customer with id '${fakeUuid}' was not found.`);
    });

    it('POST /simulations - should return 400 with RFC 7807 validation error when activeUsers is negative', async () => {
      const response = await request(app.getHttpServer())
        .post('/simulations')
        .send({
          customerId: createdCustomerEsId,
          activeUsers: -5,
          storageGb: 10,
          apiCalls: 1000,
        })
        .expect(400);

      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(response.body.type).toBe('https://errors.saas-o-matic.com/400');
      expect(response.body.invalidParams).toBeDefined();
      expect(
        response.body.invalidParams.some(
          (param: { name: string }) => param.name === 'activeUsers',
        ),
      ).toBe(true);
    });

    it('GET /simulations?customerId= - should return historical simulations of customer ordered by date desc', async () => {
      await request(app.getHttpServer())
        .post('/simulations')
        .send({
          customerId: createdCustomerEsId,
          activeUsers: 50,
          storageGb: 200,
          apiCalls: 75000,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/simulations?customerId=${createdCustomerEsId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].activeUsers).toBe(50);
      expect(response.body[1].activeUsers).toBe(15);
    });
  });
});
