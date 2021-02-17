import getApp from '../server/index.js';
import authenticateUser from './helpers/authentication.js';
import testData from '../__fixtures__/testData.js';

const { users: [defaultUser] } = testData;

let app;
let cookie;

const routesRequiredSignOut = [
  {
    method: 'GET',
    name: 'newUser',
  },
  {
    method: 'GET',
    name: 'newSession',
  },
  {
    method: 'POST',
    name: 'users',
  },
];

const userRoutes = [
  {
    method: 'GET',
    name: 'users',
  },
  {
    method: 'GET',
    name: 'userAccount',
  },
  {
    method: 'PATCH',
    name: 'userProfile',
  },
  {
    method: 'PATCH',
    name: 'userPassword',
  },
  {
    method: 'DELETE',
    name: 'userAccount',
  },
];
const statusRoutes = [
  {
    method: 'GET',
    name: 'statuses',
  },
  {
    method: 'GET',
    name: 'editStatus',
    args: { id: 1 },
  },
  {
    method: 'POST',
    name: 'statuses',
  },
  {
    method: 'PATCH',
    name: 'status',
    args: { id: 1 },
  },
  {
    method: 'DELETE',
    name: 'status',
    args: { id: 1 },
  },
];
const taskRoutes = [
  {
    method: 'GET',
    name: 'tasks',
  },
  {
    method: 'GET',
    name: 'newTask',
  },
  {
    method: 'POST',
    name: 'tasks',
  },
  {
    method: 'GET',
    name: 'task',
    args: { id: 1 },
  },
  {
    method: 'GET',
    name: 'editTask',
    args: { id: 1 },
  },
  {
    method: 'PATCH',
    name: 'task',
    args: { id: 1 },
  },
  {
    method: 'DELETE',
    name: 'task',
    args: { id: 1 },
  },
];
const labelRoutes = [
  {
    method: 'GET',
    name: 'labels',
  },
  {
    method: 'GET',
    name: 'editLabel',
    args: { id: 1 },
  },
  {
    method: 'POST',
    name: 'labels',
  },
  {
    method: 'PATCH',
    name: 'label',
    args: { id: 1 },
  },
  {
    method: 'DELETE',
    name: 'label',
    args: { id: 1 },
  },
];

const routesRequiredSignIn = [
  ...userRoutes,
  ...statusRoutes,
  ...taskRoutes,
  ...labelRoutes,
];

beforeAll(async () => {
  app = await getApp();
  await app.objection.knex.migrate.latest();
  await app.objection.knex.seed.run({ directory: './__tests__/seeds' });
  cookie = await authenticateUser(app, defaultUser);
});

afterAll(async () => {
  await app.objection.knex.migrate.rollback();
  app.close();
});

test.each(routesRequiredSignOut)('%O', async (route) => {
  const signInResponse = await app.inject({
    method: route.method,
    url: app.reverse(route.name),
    cookies: cookie,
  });

  expect(signInResponse.statusCode).toBe(302);
  expect(signInResponse.headers.location).toBe(app.reverse('root'));

  if (route.method === 'GET') {
    const responseSignedOut = await app.inject({
      method: route.method,
      url: app.reverse(route.name),
    });
    expect(responseSignedOut.statusCode).toBe(200);
  }
});

test.each(routesRequiredSignIn)('%O', async (route) => {
  const signOutResponse = await app.inject({
    method: route.method,
    url: app.reverse(route.name, route.args),
  });

  expect(signOutResponse.statusCode).toBe(302);
  expect(signOutResponse.headers.location).toBe(app.reverse('root'));

  if (route.method === 'GET') {
    const responseSignedIn = await app.inject({
      method: route.method,
      url: app.reverse(route.name, route.args),
      cookies: cookie,
    });
    expect(responseSignedIn.statusCode).toBe(200);
  }
});
