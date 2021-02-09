import tap from 'tap';
import getApp from '../server/index.js';
import authenticateUser from './testHelpers/authentication.js';
import testData from './testHelpers/testData.js';

tap.test(async (subTest) => {
  const { test } = subTest;
  const app = await getApp();

  subTest.tearDown(() => app.close());

  await app.objection.knex.migrate.latest();
  await app.objection.knex.seed.run({ directory: './test/seeds' });

  const { users: [user] } = testData;
  const cookie = await authenticateUser(app, user);

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

  routesRequiredSignOut.forEach((route) => {
    test(`${route.method} ${route.url}:`, async (t) => {
      const location = app.reverse('root');
      const responseSignedIn = await app.inject({ ...route, cookies: cookie });

      if (route.method === 'GET') {
        const responseSignedOut = await app.inject(route);
        t.equal(responseSignedOut.statusCode, 200, 'w/o signing in a status code of 200 returned');
      }
      t.equal(responseSignedIn.statusCode, 302, 'with signing in a status code of 302 returned...');
      t.equal(responseSignedIn.headers.location, location, `...and redirected to '${location}'`);
    });
  });

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

  routesRequiredSignIn.forEach((route) => {
    test(`${route.method} ${route.url}:`, async (t) => {
      const location = app.reverse('root');
      const responseSignedOut = await app.inject(route);

      t.equal(responseSignedOut.statusCode, 302, 'w/o signing in returns a status code of 302...');
      t.equal(responseSignedOut.headers.location, location, `...and redirected to '${location}'`);

      if (route.method === 'GET') {
        const responseSignedIn = await app.inject({ ...route, cookies: cookie });
        t.equal(responseSignedIn.statusCode, 200, 'with signing in returns a status code of 200');
      }
    });
  });
});
