import getApp from '../server/index.js';
import authenticateUser from './helpers/authentication.js';
import testData from '../__fixtures__/testData.js';

const { users: [defaultUser] } = testData;

let app;
let cookie;

const routesRequiredSignOut = [
  {
    method: 'GET',
    url: '/users/new',
  },
  {
    method: 'GET',
    url: '/session/new',
  },
  {
    method: 'POST',
    url: '/users',
  },
];

const userRoutes = [
  {
    method: 'GET',
    url: '/users',
  },
  {
    method: 'GET',
    url: '/user',
  },
  {
    method: 'PATCH',
    url: '/user/profile',
  },
  {
    method: 'PATCH',
    url: '/user/password',
  },
  {
    method: 'DELETE',
    url: '/user',
  },
];
const statusRoutes = [
  {
    method: 'GET',
    url: '/statuses',
  },
  {
    method: 'GET',
    url: '/statuses/1/edit',
  },
  {
    method: 'POST',
    url: '/statuses',
  },
  {
    method: 'PATCH',
    url: '/statuses/1',
  },
  {
    method: 'DELETE',
    url: '/statuses/1',
  },
];
const taskRoutes = [
  {
    method: 'GET',
    url: '/tasks',
  },
  {
    method: 'GET',
    url: '/tasks/new',
  },
  {
    method: 'POST',
    url: '/tasks',
  },
  {
    method: 'GET',
    url: '/tasks/1',
  },
  {
    method: 'GET',
    url: '/tasks/1/edit',
  },
  {
    method: 'PATCH',
    url: '/tasks/1',
  },
  {
    method: 'DELETE',
    url: '/tasks/1',
  },
];
const labelRoutes = [
  {
    method: 'GET',
    url: '/labels',
  },
  {
    method: 'GET',
    url: '/labels/1/edit',
  },
  {
    method: 'POST',
    url: '/labels',
  },
  {
    method: 'PATCH',
    url: '/labels/1',
  },
  {
    method: 'DELETE',
    url: '/labels/1',
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
  const signInResponse = await app.inject({ ...route, cookies: cookie });

  expect(signInResponse.statusCode).toBe(302);
  expect(signInResponse.headers.location).toBe(app.reverse('root'));

  if (route.method === 'GET') {
    const responseSignedOut = await app.inject(route);
    expect(responseSignedOut.statusCode).toBe(200);
  }
});

test.each(routesRequiredSignIn)('%O', async (route) => {
  const signOutResponse = await app.inject(route);

  expect(signOutResponse.statusCode).toBe(302);
  expect(signOutResponse.headers.location).toBe(app.reverse('root'));

  if (route.method === 'GET') {
    const responseSignedIn = await app.inject({ ...route, cookies: cookie });
    expect(responseSignedIn.statusCode).toBe(200);
  }
});
