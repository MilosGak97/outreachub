import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import { AppModule } from 'src/app.module';
import { AuthGuard } from 'src/api/client/auth/guards';
import { UserType } from 'src/api/enums/user/user-type.enum';
import { CompanyStatus } from 'src/api/enums/user/company-status.enum';
import { Company } from 'src/api/entities/company.entity';
import { FilterPreset } from 'src/api/entities/filter-preset.entity';

jest.setTimeout(60000);

type TestUser = {
  id: string;
  userType: UserType;
  companyId: string;
};

const authTokens = {
  userA: 'user-a',
  userB: 'user-b',
  userC: 'user-c',
  invalid: 'invalid',
};

const testUsers: Record<string, TestUser> = {};

const buildContext = () => ({
  conceptKey: `test-concept-${randomUUID()}`,
  tableId: `table-${randomUUID()}`,
});

const buildFilterState = (filters: Record<string, any> = {}) => ({
  version: 1,
  searchText: null,
  filters,
});

@Injectable()
class TestAuthGuard implements CanActivate {
  constructor(private readonly cls: ClsService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['x-test-auth'];

    if (!token || Array.isArray(token)) {
      throw new UnauthorizedException('Missing auth');
    }

    if (token === authTokens.invalid || !testUsers[token]) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = testUsers[token];
    req.user = {
      id: user.id,
      userType: user.userType,
      company: { id: user.companyId },
    };

    this.cls.set('companyId', user.companyId);
    return true;
  }
}

describe('FilterPresetController (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let companyIds: string[] = [];

  const createPreset = async (
    server: any,
    token: string,
    context: { conceptKey: string; tableId: string },
    overrides?: Partial<{ name: string; isDefault: boolean; filterState: any }>,
  ) => {
    const payload = {
      conceptKey: context.conceptKey,
      tableId: context.tableId,
      name: overrides?.name ?? `Preset ${randomUUID()}`,
      isDefault: overrides?.isDefault ?? false,
      filterState: overrides?.filterState ?? buildFilterState(),
    };

    const response = await request(server)
      .post('/filter-presets')
      .set('x-test-auth', token)
      .send(payload)
      .expect(201);

    return response.body as { id: string };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useClass(TestAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    const companyRepo = dataSource.getRepository(Company);

    const companyA = await companyRepo.save(
      companyRepo.create({
        name: `Filter Preset Test Company A ${randomUUID()}`,
        website: `https://company-a-${randomUUID()}.example`,
        status: CompanyStatus.ACTIVE,
      }),
    );

    const companyB = await companyRepo.save(
      companyRepo.create({
        name: `Filter Preset Test Company B ${randomUUID()}`,
        website: `https://company-b-${randomUUID()}.example`,
        status: CompanyStatus.ACTIVE,
      }),
    );

    companyIds = [companyA.id, companyB.id];

    testUsers[authTokens.userA] = {
      id: randomUUID(),
      userType: UserType.USER,
      companyId: companyA.id,
    };
    testUsers[authTokens.userB] = {
      id: randomUUID(),
      userType: UserType.USER,
      companyId: companyA.id,
    };
    testUsers[authTokens.userC] = {
      id: randomUUID(),
      userType: UserType.USER,
      companyId: companyB.id,
    };
  });

  afterEach(async () => {
    if (!dataSource || companyIds.length === 0) {
      return;
    }

    const repo = dataSource.getRepository(FilterPreset);
    await Promise.all(companyIds.map((companyId) => repo.delete({ companyId })));
  });

  afterAll(async () => {
    if (dataSource && companyIds.length > 0) {
      const presetRepo = dataSource.getRepository(FilterPreset);
      const companyRepo = dataSource.getRepository(Company);
      await Promise.all(companyIds.map((companyId) => presetRepo.delete({ companyId })));
      await Promise.all(companyIds.map((companyId) => companyRepo.delete({ id: companyId })));
    }

    if (app) {
      await app.close();
    }
  });

  it('creates, lists, gets, updates, sets default, clears default, and deletes a preset', async () => {
    const server = app.getHttpServer();
    const context = buildContext();
    const createPayload = {
      conceptKey: context.conceptKey,
      tableId: context.tableId,
      name: 'Active companies',
      isDefault: false,
      filterState: buildFilterState({ status: ['active'] }),
    };

    const createResponse = await request(server)
      .post('/filter-presets')
      .set('x-test-auth', authTokens.userA)
      .send(createPayload)
      .expect(201);

    const presetId = createResponse.body.id as string;
    expect(presetId).toBeDefined();
    expect(createResponse.body.name).toBe(createPayload.name);
    expect(createResponse.body.isDefault).toBe(false);
    expect(createResponse.body.filterState).toMatchObject(createPayload.filterState);
    expect(createResponse.body.conceptKey).toBe(context.conceptKey);
    expect(createResponse.body.tableId).toBe(context.tableId);

    const listResponse = await request(server)
      .get('/filter-presets')
      .set('x-test-auth', authTokens.userA)
      .query({ conceptKey: context.conceptKey, tableId: context.tableId })
      .expect(200);

    expect(listResponse.body.context).toEqual({
      conceptKey: context.conceptKey,
      tableId: context.tableId,
    });
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].id).toBe(presetId);

    const getResponse = await request(server)
      .get(`/filter-presets/${presetId}`)
      .set('x-test-auth', authTokens.userA)
      .expect(200);

    expect(getResponse.body.id).toBe(presetId);
    expect(getResponse.body.isDefault).toBe(false);

    const updatePayload = {
      name: 'Updated companies filter',
      filterState: buildFilterState({ status: ['inactive'] }),
    };

    const updateResponse = await request(server)
      .patch(`/filter-presets/${presetId}`)
      .set('x-test-auth', authTokens.userA)
      .send(updatePayload)
      .expect(200);

    expect(updateResponse.body.name).toBe(updatePayload.name);
    expect(updateResponse.body.filterState).toMatchObject(updatePayload.filterState);

    const setDefaultResponse = await request(server)
      .patch(`/filter-presets/${presetId}`)
      .set('x-test-auth', authTokens.userA)
      .send({ isDefault: true })
      .expect(200);

    expect(setDefaultResponse.body.isDefault).toBe(true);

    const clearDefaultResponse = await request(server)
      .delete('/filter-presets/default')
      .set('x-test-auth', authTokens.userA)
      .query({ conceptKey: context.conceptKey, tableId: context.tableId })
      .expect(200);

    expect(clearDefaultResponse.body).toEqual({ cleared: true });

    const afterClearResponse = await request(server)
      .get(`/filter-presets/${presetId}`)
      .set('x-test-auth', authTokens.userA)
      .expect(200);

    expect(afterClearResponse.body.isDefault).toBe(false);

    const deleteResponse = await request(server)
      .delete(`/filter-presets/${presetId}`)
      .set('x-test-auth', authTokens.userA)
      .expect(200);

    expect(deleteResponse.body).toEqual({ deleted: true });

    const listAfterDeleteResponse = await request(server)
      .get('/filter-presets')
      .set('x-test-auth', authTokens.userA)
      .query({ conceptKey: context.conceptKey, tableId: context.tableId })
      .expect(200);

    expect(listAfterDeleteResponse.body.items).toHaveLength(0);
  });

  it('returns 401 when no auth header is provided', async () => {
    const server = app.getHttpServer();
    const context = buildContext();

    await request(server)
      .get('/filter-presets')
      .query({ conceptKey: context.conceptKey, tableId: context.tableId })
      .expect(401);
  });

  it('returns 401 when auth header is invalid', async () => {
    const server = app.getHttpServer();
    const context = buildContext();

    await request(server)
      .get('/filter-presets')
      .set('x-test-auth', authTokens.invalid)
      .query({ conceptKey: context.conceptKey, tableId: context.tableId })
      .expect(401);
  });

  it('does not list presets owned by another user in the same company', async () => {
    const server = app.getHttpServer();
    const context = buildContext();

    await createPreset(server, authTokens.userA, context);

    const listResponse = await request(server)
      .get('/filter-presets')
      .set('x-test-auth', authTokens.userB)
      .query({ conceptKey: context.conceptKey, tableId: context.tableId })
      .expect(200);

    expect(listResponse.body.items).toHaveLength(0);
  });

  it('does not allow another user to get a preset in the same company', async () => {
    const server = app.getHttpServer();
    const context = buildContext();
    const preset = await createPreset(server, authTokens.userA, context);

    await request(server)
      .get(`/filter-presets/${preset.id}`)
      .set('x-test-auth', authTokens.userB)
      .expect(404);
  });

  it('does not allow another user to update a preset in the same company', async () => {
    const server = app.getHttpServer();
    const context = buildContext();
    const preset = await createPreset(server, authTokens.userA, context);

    await request(server)
      .patch(`/filter-presets/${preset.id}`)
      .set('x-test-auth', authTokens.userB)
      .send({ name: 'Unauthorized update' })
      .expect(404);
  });

  it('does not allow another user to delete a preset in the same company', async () => {
    const server = app.getHttpServer();
    const context = buildContext();
    const preset = await createPreset(server, authTokens.userA, context);

    await request(server)
      .delete(`/filter-presets/${preset.id}`)
      .set('x-test-auth', authTokens.userB)
      .expect(404);
  });

  it('does not allow cross-company access to presets', async () => {
    const server = app.getHttpServer();
    const context = buildContext();
    const preset = await createPreset(server, authTokens.userA, context);

    const listResponse = await request(server)
      .get('/filter-presets')
      .set('x-test-auth', authTokens.userC)
      .query({ conceptKey: context.conceptKey, tableId: context.tableId })
      .expect(200);

    expect(listResponse.body.items).toHaveLength(0);

    await request(server)
      .get(`/filter-presets/${preset.id}`)
      .set('x-test-auth', authTokens.userC)
      .expect(404);
  });

  it('rejects duplicate preset names within the same context', async () => {
    const server = app.getHttpServer();
    const context = buildContext();
    const name = 'Duplicate name';

    await createPreset(server, authTokens.userA, context, { name });

    await request(server)
      .post('/filter-presets')
      .set('x-test-auth', authTokens.userA)
      .send({
        conceptKey: context.conceptKey,
        tableId: context.tableId,
        name,
        isDefault: false,
        filterState: buildFilterState({ status: ['active'] }),
      })
      .expect(409);
  });

  it('rejects renaming a preset to an existing name in the same context', async () => {
    const server = app.getHttpServer();
    const context = buildContext();

    const existing = await createPreset(server, authTokens.userA, context, { name: 'Primary' });
    const target = await createPreset(server, authTokens.userA, context, { name: 'Secondary' });

    await request(server)
      .patch(`/filter-presets/${target.id}`)
      .set('x-test-auth', authTokens.userA)
      .send({ name: 'Primary' })
      .expect(409);
  });

  it('allows the same name in different contexts', async () => {
    const server = app.getHttpServer();
    const contextA = buildContext();
    const contextB = buildContext();
    const sharedName = 'Shared name';

    await createPreset(server, authTokens.userA, contextA, { name: sharedName });

    await request(server)
      .post('/filter-presets')
      .set('x-test-auth', authTokens.userA)
      .send({
        conceptKey: contextB.conceptKey,
        tableId: contextB.tableId,
        name: sharedName,
        isDefault: false,
        filterState: buildFilterState({ status: ['active'] }),
      })
      .expect(201);
  });

  it(
    'enforces a maximum of 50 presets per context',
    async () => {
      const server = app.getHttpServer();
      const context = buildContext();

      for (let i = 0; i < 50; i += 1) {
        await createPreset(server, authTokens.userA, context, { name: `Preset ${i + 1}` });
      }

      await request(server)
        .post('/filter-presets')
        .set('x-test-auth', authTokens.userA)
        .send({
          conceptKey: context.conceptKey,
          tableId: context.tableId,
          name: 'Preset 51',
          isDefault: false,
          filterState: buildFilterState({ status: ['extra'] }),
        })
        .expect(422);
    },
    60000,
  );

  it('keeps only one default per context when setting a new default', async () => {
    const server = app.getHttpServer();
    const context = buildContext();

    const first = await createPreset(server, authTokens.userA, context, {
      name: 'Default A',
      isDefault: true,
    });
    const second = await createPreset(server, authTokens.userA, context, {
      name: 'Default B',
      isDefault: true,
    });

    const firstResponse = await request(server)
      .get(`/filter-presets/${first.id}`)
      .set('x-test-auth', authTokens.userA)
      .expect(200);

    const secondResponse = await request(server)
      .get(`/filter-presets/${second.id}`)
      .set('x-test-auth', authTokens.userA)
      .expect(200);

    expect(firstResponse.body.isDefault).toBe(false);
    expect(secondResponse.body.isDefault).toBe(true);

    const listResponse = await request(server)
      .get('/filter-presets')
      .set('x-test-auth', authTokens.userA)
      .query({ conceptKey: context.conceptKey, tableId: context.tableId })
      .expect(200);

    const defaultCount = listResponse.body.items.filter((item: { isDefault: boolean }) => item.isDefault)
      .length;
    expect(defaultCount).toBe(1);
  });

  it('clears the default when the default preset is deleted', async () => {
    const server = app.getHttpServer();
    const context = buildContext();

    const defaultPreset = await createPreset(server, authTokens.userA, context, {
      name: 'Default preset',
      isDefault: true,
    });
    const otherPreset = await createPreset(server, authTokens.userA, context, {
      name: 'Other preset',
      isDefault: false,
    });

    await request(server)
      .delete(`/filter-presets/${defaultPreset.id}`)
      .set('x-test-auth', authTokens.userA)
      .expect(200);

    const listResponse = await request(server)
      .get('/filter-presets')
      .set('x-test-auth', authTokens.userA)
      .query({ conceptKey: context.conceptKey, tableId: context.tableId })
      .expect(200);

    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].id).toBe(otherPreset.id);
    expect(listResponse.body.items[0].isDefault).toBe(false);
  });
});
