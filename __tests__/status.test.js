import casual from 'casual';
import formAutoContent from 'form-auto-content';
import getApp from '../server/index.js';
import authenticateUser from './helpers/authentication.js';
import testData from '../__fixtures__/testData.js';

const { users: [defaultUser] } = testData;

let app;
let models;
let knex;
let cookie;

beforeAll(async () => {
  app = await getApp();
  models = app.objection.models;
  knex = app.objection.knex;
});

afterAll(() => {
  app.close();
});

beforeEach(async () => {
  await knex.migrate.latest();
  await knex.seed.run({ directory: './__tests__/seeds' });
  cookie = await authenticateUser(app, defaultUser);
});

afterEach(async () => {
  await knex.migrate.rollback();
});

describe('create task status', () => {
  test('create status with valid data', async () => {
    const statusName = casual.title;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      ...formAutoContent({ name: statusName }),
      cookies: cookie,
    });
    const status = await models.status.query().findOne({ name: statusName });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('statuses'));
    expect(status.name).toBe(statusName);
  });

  test('create status with invalid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      ...formAutoContent({ name: '' }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });
});

describe('update task status', () => {
  test('update status with valid data', async () => {
    const newStatusName = casual.title;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('status', { id: 1 }),
      ...formAutoContent({ name: newStatusName }),
      cookies: cookie,
    });
    const status = await models.status.query().findById(1);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('statuses'));
    expect(status.name).toBe(newStatusName);
  });

  test('update status with invalid data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('status', { id: 1 }),
      ...formAutoContent({ name: '' }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });
});

describe('delete task status', () => {
  test('delete status', async () => {
    const { statuses: [deletingStatus] } = testData;
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('status', { id: 1 }),
      cookies: cookie,
    });
    const statuses = await models.status.query();
    const actualStatusNames = statuses.map(({ name }) => name);
    const expectedStatusNames = testData.statuses
      .map(({ name }) => name)
      .filter((name) => name !== deletingStatus.name);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('statuses'));
    expect(actualStatusNames).toEqual(expectedStatusNames);
  });

  test('delete related status', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('status', { id: 2 }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });
});
