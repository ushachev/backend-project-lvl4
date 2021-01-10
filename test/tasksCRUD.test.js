import tap from 'tap';
import casual from 'casual';
import formAutoContent from 'form-auto-content';
import { merge } from 'lodash';
import getApp from '../server/index.js';
import { addFakeUser, authenticateUser } from './testHelpers/authentication.js';

tap.test('tasks CRUD test', async (subTest) => {
  const { test } = subTest;
  const app = getApp();

  subTest.tearDown(() => app.close());

  await app.ready();
  await app.objection.knex.migrate.latest();

  const cookie = await authenticateUser(app, await addFakeUser(app));

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

  taskRoutes.forEach((route) => {
    test(`${route.method} ${route.url} availability w/o signing in:`, async (t) => {
      const location = app.reverse('root');
      const response = await app.inject(route);

      t.equal(response.statusCode, 302, 'a status code of 302 returned');
      t.equal(response.headers.location, location, `and redirected to '${location}'`);
    });
  });

  test('CRUD flow with signing in:', async (t) => {
    const location = app.reverse('tasks');

    const tasksResponse = await app.inject({
      method: 'GET',
      url: '/tasks',
      headers: { cookie },
    });
    t.equal(tasksResponse.statusCode, 200, 'GET /tasks returns a status code of 200');

    const newTaskFormResponse = await app.inject({
      method: 'GET',
      url: '/tasks/new',
      headers: { cookie },
    });
    t.equal(newTaskFormResponse.statusCode, 200, 'GET /tasks/new returns a status code of 200');

    await app.inject({
      method: 'POST',
      url: '/statuses',
      ...merge(formAutoContent({ name: casual.short_description }), { headers: { cookie } }),
    });
    const newTaskResponse = await app.inject({
      method: 'POST',
      url: '/tasks',
      ...merge(
        formAutoContent({
          name: casual.short_description,
          statusId: '1',
        }),
        { headers: { cookie } },
      ),
    });
    t.equal(newTaskResponse.statusCode, 302, 'POST /tasks returns a status code of 302');
    t.equal(newTaskResponse.headers.location, location, `and redirected to '${location}'`);

    const taskViewResponse = await app.inject({
      method: 'GET',
      url: '/tasks/1',
      headers: { cookie },
    });
    t.equal(taskViewResponse.statusCode, 200, 'GET /tasks/1 returns a status code of 200');

    const taskEditFormResponse = await app.inject({
      method: 'GET',
      url: '/tasks/1/edit',
      headers: { cookie },
    });
    t.equal(taskEditFormResponse.statusCode, 200, 'GET /tasks/1/edit returns a status code of 200');

    const taskEditResponse = await app.inject({
      method: 'PATCH',
      url: '/tasks/1',
      ...merge(
        formAutoContent({
          name: casual.short_description,
          statusId: '1',
        }),
        { headers: { cookie } },
      ),
    });
    t.equal(taskEditResponse.statusCode, 302, 'PATCH /tasks/1 returns a status code of 302');
    t.equal(taskEditResponse.headers.location, location, `and redirected to '${location}'`);

    const taskFailEditResponse = await app.inject({
      method: 'PATCH',
      url: '/tasks/1',
      ...merge(
        formAutoContent({
          name: '',
          statusId: '1',
        }),
        { headers: { cookie } },
      ),
    });
    t.equal(taskFailEditResponse.statusCode, 422, 'PATCH /tasks/1 with invalid data returns a status code of 422');

    const anoterUser = await addFakeUser(app);
    const cookieOfAnotherUser = await authenticateUser(app, anoterUser);
    const unauthorizedDeletionResponse = await app.inject({
      method: 'DELETE',
      url: '/tasks/1',
      headers: { cookie: cookieOfAnotherUser },
    });
    t.equal(
      unauthorizedDeletionResponse.statusCode,
      422,
      'DELETE /tasks/1 while under unauthorized account returns a status code of 422',
    );

    const deleteTaskResponse = await app.inject({
      method: 'DELETE',
      url: '/tasks/1',
      headers: { cookie },
    });
    t.equal(deleteTaskResponse.statusCode, 302, 'DELETE /tasks/1 returns a status code of 302');
    t.equal(deleteTaskResponse.headers.location, location, `and redirected to '${location}'`);
  });

  test('POST /tasks with invalid data', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/tasks',
      ...merge(
        formAutoContent({
          name: '',
          statusId: '1',
        }),
        { headers: { cookie } },
      ),
    });
    t.equal(response.statusCode, 422, 'POST /tasks returns a status code of 422');
  });

  test('POST /tasks with inconsistent data', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/tasks',
      ...merge(
        formAutoContent({
          name: casual.short_description,
          statusId: '10',
        }),
        { headers: { cookie } },
      ),
    });
    t.equal(response.statusCode, 500, 'POST /tasks returns a status code of 500');
  });
});
