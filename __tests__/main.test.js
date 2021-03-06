import casual from 'casual';
import formAutoContent from 'form-auto-content';
import getApp from '../server/index.js';
import authenticateUser from './helpers/authentication.js';
import getTaskIdsFromHtml from './helpers/parseHtml.js';
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

describe('create task', () => {
  test('create task with valid data', async () => {
    const taskName = casual.short_description;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      ...formAutoContent({ name: taskName, statusId: '1' }),
      cookies: cookie,
    });
    const task = await models.task.query().findOne({ name: taskName });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('tasks'));
    expect(task.name).toBe(taskName);
  });

  test('create task with invalid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      ...formAutoContent({ name: '', statusId: '1' }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });

  test('create task with inconsistent data', async () => {
    const taskName = casual.short_description;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      ...formAutoContent({ name: taskName, statusId: '10' }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(500);
  });
});

describe('update task', () => {
  test('update task with valid data', async () => {
    const { tasks: [task] } = testData;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('task', { id: 1 }),
      ...formAutoContent({ name: task.name, statusId: '2' }),
      cookies: cookie,
    });
    const updatedTask = await models.task.query().findById(1);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('tasks'));
    expect(updatedTask.statusId).toBe(2);
  });

  test('update task with invalid data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('task', { id: 1 }),
      ...formAutoContent({ name: '', statusId: '1' }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });

  test('update task with inconsistent data', async () => {
    const { tasks: [task] } = testData;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('task', { id: 1 }),
      ...formAutoContent({ name: task.name, statusId: '10' }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(500);
  });
});

describe('delete task', () => {
  test('delete a task by the author', async () => {
    const { users: [, taskAuthor], tasks: [deletingTask] } = testData;
    const taskAuthorCookie = await authenticateUser(app, taskAuthor);
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('task', { id: 1 }),
      cookies: taskAuthorCookie,
    });
    const tasks = await models.task.query();
    const actualTaskNames = tasks.map(({ name }) => name);
    const expectedTaskNames = testData.tasks
      .map(({ name }) => name)
      .filter((name) => name !== deletingTask.name);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('tasks'));
    expect(actualTaskNames).toEqual(expectedTaskNames);
  });

  test('delete task under unauthorized account', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('task', { id: 2 }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });
});

test('filter tasks', async () => {
  const filterResponse1 = await app.inject({
    method: 'GET',
    url: app.reverse('tasks'),
    query: {
      status: '2',
      executor: '3',
      label: '2',
    },
    cookies: cookie,
  });
  const filteredTaskIds1 = getTaskIdsFromHtml(filterResponse1.body);

  expect(filterResponse1.statusCode).toBe(200);
  expect(filteredTaskIds1).toEqual([1]);

  const filterResponse2 = await app.inject({
    method: 'GET',
    url: app.reverse('tasks'),
    query: {
      status: '3',
      executor: '2',
      label: '3',
    },
    cookies: cookie,
  });
  const filteredTaskIds2 = getTaskIdsFromHtml(filterResponse2.body);

  expect(filteredTaskIds2).toEqual([2]);

  const filterResponse3 = await app.inject({
    method: 'GET',
    url: app.reverse('tasks'),
    query: {
      label: '3',
    },
    cookies: cookie,
  });
  const filteredTaskIds3 = getTaskIdsFromHtml(filterResponse3.body);

  expect(filteredTaskIds3).toEqual([1, 2]);

  const { users: [, taskCreator] } = testData;
  const creatorCookie = await authenticateUser(app, taskCreator);
  const filterResponse4 = await app.inject({
    method: 'GET',
    url: app.reverse('tasks'),
    query: {
      label: '3',
      isCreatorUser: 'on',
    },
    cookies: creatorCookie,
  });
  const filteredTaskIds4 = getTaskIdsFromHtml(filterResponse4.body);

  expect(filteredTaskIds4).toEqual([1]);
});
