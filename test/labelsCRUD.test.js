import tap from 'tap';
import casual from 'casual';
import formAutoContent from 'form-auto-content';
import { merge } from 'lodash';
import getApp from '../server/index.js';
import { addFakeUser, authenticateUser } from './testHelpers/authentication.js';

tap.test('labels CRUD test', async (subTest) => {
  const { test } = subTest;
  const app = getApp();

  subTest.tearDown(() => app.close());

  await app.ready();
  await app.objection.knex.migrate.latest();

  const cookie = await authenticateUser(app, await addFakeUser(app));

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

  labelRoutes.forEach((route) => {
    test(`${route.method} ${route.url} availability w/o signing in:`, async (t) => {
      const location = app.reverse('root');
      const response = await app.inject(route);

      t.equal(response.statusCode, 302, 'a status code of 302 returned');
      t.equal(response.headers.location, location, `and redirected to '${location}'`);
    });
  });

  test('CRUD flow with signing in:', async (t) => {
    const location = app.reverse('labels');

    const labelsResponse = await app.inject({
      method: 'GET',
      url: '/labels',
      headers: { cookie },
    });
    t.equal(labelsResponse.statusCode, 200, 'GET /labels returns a status code of 200');

    const newLabelResponse = await app.inject({
      method: 'POST',
      url: '/labels',
      ...merge(formAutoContent({ name: casual.short_description }), { headers: { cookie } }),
    });
    t.equal(newLabelResponse.statusCode, 302, 'POST /labels returns a status code of 302');
    t.equal(newLabelResponse.headers.location, location, `and redirected to '${location}'`);

    const editLabelResponse = await app.inject({
      method: 'GET',
      url: '/labels/1/edit',
      headers: { cookie },
    });
    t.equal(editLabelResponse.statusCode, 200, 'GET /labels/1/edit returns a status code of 200');

    const patchLabelResponse = await app.inject({
      method: 'PATCH',
      url: '/labels/1',
      ...merge(formAutoContent({ name: casual.short_description }), { headers: { cookie } }),
    });
    t.equal(patchLabelResponse.statusCode, 302, 'PATCH /labels/1 returns a status code of 302');
    t.equal(patchLabelResponse.headers.location, location, `and redirected to '${location}'`);

    const response = await app.inject({
      method: 'PATCH',
      url: '/labels/1',
      ...merge(formAutoContent({ name: '' }), { headers: { cookie } }),
    });
    t.equal(response.statusCode, 422, 'PATCH /labels/1 with invalid data returns a status code of 422');

    const deleteLabelResponse = await app.inject({
      method: 'DELETE',
      url: '/labels/1',
      headers: { cookie },
    });
    t.equal(deleteLabelResponse.statusCode, 302, 'DELETE /labels/1 returns a status code of 302');
    t.equal(deleteLabelResponse.headers.location, location, `and redirected to '${location}'`);
  });

  test('POST /labels with invalid data', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/labels',
      ...merge(formAutoContent({ name: '' }), { headers: { cookie } }),
    });
    t.equal(response.statusCode, 422, 'POST /labels returns a status code of 422');
  });
});
