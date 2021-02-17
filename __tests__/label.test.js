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

describe('create label', () => {
  test('create label with valid data', async () => {
    const labelName = casual.title;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      ...formAutoContent({ name: labelName }),
      cookies: cookie,
    });
    const label = await models.label.query().findOne({ name: labelName });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('labels'));
    expect(label.name).toBe(labelName);
  });

  test('create label with invalid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      ...formAutoContent({ name: '' }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });
});

describe('update label', () => {
  test('update label with valid data', async () => {
    const newLabelName = casual.title;
    const response = await app.inject({
      method: 'PATCH',
      url: `${app.reverse('labels')}/1`,
      ...formAutoContent({ name: newLabelName }),
      cookies: cookie,
    });
    const label = await models.label.query().findById(1);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('labels'));
    expect(label.name).toBe(newLabelName);
  });

  test('update label with invalid data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `${app.reverse('labels')}/1`,
      ...formAutoContent({ name: '' }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });
});

describe('delete label', () => {
  test('delete label', async () => {
    const { labels: [deletingLabel] } = testData;
    const response = await app.inject({
      method: 'DELETE',
      url: `${app.reverse('labels')}/1`,
      cookies: cookie,
    });
    const labels = await models.label.query();
    const actualLabelNames = labels.map(({ name }) => name);
    const expectedLabelNames = testData.labels
      .map(({ name }) => name)
      .filter((name) => name !== deletingLabel.name);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('labels'));
    expect(actualLabelNames).toEqual(expectedLabelNames);
  });

  test('delete related label', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `${app.reverse('labels')}/2`,
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });
});
