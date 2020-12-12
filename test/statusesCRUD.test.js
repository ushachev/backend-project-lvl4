import tap from 'tap';
import casual from 'casual';
import formAutoContent from 'form-auto-content';
import { merge } from 'lodash';
import getApp from '../server/index.js';
import { addFakeUser, authenticateUser } from './testHelpers/authentication.js';

tap.test('statuses CRUD test', async (subTest) => {
  const { test } = subTest;
  const app = getApp();

  subTest.tearDown(() => app.close());

  await app.ready();
  await app.objection.knex.migrate.latest();

  const cookie = await authenticateUser(app, await addFakeUser(app));

  const statusRoutes = [
    {
      method: 'GET',
      url: '/taskStatuses',
    },
    {
      method: 'GET',
      url: '/taskStatuses/1/edit',
    },
    {
      method: 'POST',
      url: '/taskStatuses',
    },
    {
      method: 'PATCH',
      url: '/taskStatuses/1',
    },
    {
      method: 'DELETE',
      url: '/taskStatuses/1',
    },
  ];

  statusRoutes.forEach((route) => {
    test(`${route.method} ${route.url} availability w/o signing in:`, async (t) => {
      const location = app.reverse('root');
      const response = await app.inject(route);

      t.equal(response.statusCode, 302, 'a status code of 302 returned');
      t.equal(response.headers.location, location, `and redirected to '${location}'`);
    });
  });

  test('CRUD flow with signing in:', async (t) => {
    const location = app.reverse('taskStatuses');

    const statusesResponse = await app.inject({
      method: 'GET',
      url: '/taskStatuses',
      headers: { cookie },
    });
    t.equal(statusesResponse.statusCode, 200, 'GET /taskStatuses returns a status code of 200');

    const newStatusResponse = await app.inject({
      method: 'POST',
      url: '/taskStatuses',
      ...merge(formAutoContent({ name: casual.short_description }), { headers: { cookie } }),
    });
    t.equal(newStatusResponse.statusCode, 302, 'POST /taskStatuses returns a status code of 302');
    t.equal(newStatusResponse.headers.location, location, `and redirected to '${location}'`);

    const editStatusResponse = await app.inject({
      method: 'GET',
      url: '/taskStatuses/1/edit',
      headers: { cookie },
    });
    t.equal(editStatusResponse.statusCode, 200, 'GET /taskStatuses/1/edit returns a status code of 200');

    const patchStatusResponse = await app.inject({
      method: 'PATCH',
      url: '/taskStatuses/1',
      ...merge(formAutoContent({ name: casual.short_description }), { headers: { cookie } }),
    });
    t.equal(patchStatusResponse.statusCode, 302, 'PATCH /taskStatuses/1 returns a status code of 302');
    t.equal(patchStatusResponse.headers.location, location, `and redirected to '${location}'`);

    const response = await app.inject({
      method: 'PATCH',
      url: '/taskStatuses/1',
      ...merge(formAutoContent({ name: '' }), { headers: { cookie } }),
    });
    t.equal(response.statusCode, 422, 'PATCH /taskStatuses/1 with invalid data returns a status code of 422');

    const deleteStatusResponse = await app.inject({
      method: 'DELETE',
      url: '/taskStatuses/1',
      headers: { cookie },
    });
    t.equal(deleteStatusResponse.statusCode, 302, 'DELETE /taskStatuses/1 returns a status code of 302');
    t.equal(deleteStatusResponse.headers.location, location, `and redirected to '${location}'`);
  });

  test('POST /taskStatuses with invalid data', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/taskStatuses',
      ...merge(formAutoContent({ name: '' }), { headers: { cookie } }),
    });
    t.equal(response.statusCode, 422, 'POST /taskStatuses returns a status code of 422');
  });
});
