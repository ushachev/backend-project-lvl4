import tap from 'tap';
import casual from 'casual';
import formAutoContent from 'form-auto-content';
import getApp from '../server/index.js';
import authenticateUser from './testHelpers/authentication.js';
import getTaskIdsFromHtml from './testHelpers/parseHtml.js';
import testData from './testHelpers/testData.js';

tap.test(async (subTest) => {
  const { test } = subTest;
  const app = await getApp();
  const { models, knex } = app.objection;

  subTest.tearDown(async () => { await app.close(); });

  subTest.beforeEach(async (done) => {
    await knex.migrate.latest();
    await knex.seed.run({ directory: './test/seeds' });
    done();
  });

  subTest.afterEach(async (done) => {
    await knex.migrate.rollback();
    done();
  });

  const { users: [defaultUser] } = testData;

  test('create task status', async (t) => {
    const cookie = await authenticateUser(app, defaultUser);
    const location = app.reverse('statuses');

    const statusName = casual.title;
    const createResponse = await app.inject({
      method: 'POST',
      url: '/statuses',
      ...formAutoContent({ name: statusName }),
      cookies: cookie,
    });
    const status = await models.status.query().findOne({ name: statusName });

    t.equal(createResponse.statusCode, 302, 'POST /statuses returns a status code of 302');
    t.equal(createResponse.headers.location, location, `...and redirected to '${location}'`);
    t.equal(status.name, statusName, 'new task status added successfully');

    const failedCreateResponse = await app.inject({
      method: 'POST',
      url: '/statuses',
      ...formAutoContent({ name: '' }),
      cookies: cookie,
    });

    t.equal(
      failedCreateResponse.statusCode,
      422,
      'POST /statuses with invalid data returns a status code of 422',
    );
  });

  test('update task status', async (t) => {
    const cookie = await authenticateUser(app, defaultUser);
    const location = app.reverse('statuses');

    const newStatusName = casual.title;
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '/statuses/1',
      ...formAutoContent({ name: newStatusName }),
      cookies: cookie,
    });
    const updatedStatus = await models.status.query().findById(1);

    t.equal(updateResponse.statusCode, 302, 'PATCH /statuses/1 returns a status code of 302');
    t.equal(updateResponse.headers.location, location, `...and redirected to '${location}'`);
    t.equal(updatedStatus.name, newStatusName, 'status changed successfully');

    const failedUpdateResponse = await app.inject({
      method: 'PATCH',
      url: '/statuses/1',
      ...formAutoContent({ name: '' }),
      cookies: cookie,
    });

    t.equal(
      failedUpdateResponse.statusCode,
      422,
      'PATCH /statuses/1 with invalid data returns a status code of 422',
    );
  });

  test('delete task status', async (t) => {
    const { statuses: [deletingStatus] } = testData;
    const cookie = await authenticateUser(app, defaultUser);
    const location = app.reverse('statuses');

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: '/statuses/1',
      cookies: cookie,
    });
    const statuses = await models.status.query();
    const actualStatusNames = statuses.map(({ name }) => name);
    const expectedStatusNames = testData.statuses
      .map(({ name }) => name)
      .filter((name) => name !== deletingStatus.name);

    t.equal(deleteResponse.statusCode, 302, 'DELETE /statuses/1 returns a status code of 302');
    t.equal(deleteResponse.headers.location, location, `...and redirected to '${location}'`);
    t.same(actualStatusNames, expectedStatusNames, 'status deleted successfully');

    const failedDeleteResponse = await app.inject({
      method: 'DELETE',
      url: '/statuses/2',
      cookies: cookie,
    });

    t.equal(
      failedDeleteResponse.statusCode,
      422,
      'DELETE /statuses/2 on related entity returns a status code of 422',
    );
  });

  test('create task', async (t) => {
    const cookie = await authenticateUser(app, defaultUser);
    const location = app.reverse('tasks');

    const taskName = casual.short_description;
    const createResponse = await app.inject({
      method: 'POST',
      url: '/tasks',
      ...formAutoContent({ name: taskName, statusId: '1' }),
      cookies: cookie,
    });
    const task = await models.task.query().findOne({ name: taskName });

    t.equal(createResponse.statusCode, 302, 'POST /tasks returns a status code of 302');
    t.equal(createResponse.headers.location, location, `...and redirected to '${location}'`);
    t.equal(task.name, taskName, 'new task added successfully');

    const failedCreateResponse = await app.inject({
      method: 'POST',
      url: '/tasks',
      ...formAutoContent({ name: '', statusId: '1' }),
      cookies: cookie,
    });

    t.equal(
      failedCreateResponse.statusCode,
      422,
      'POST /tasks with invalid data returns a status code of 422',
    );

    const errorCreateResponse = await app.inject({
      method: 'POST',
      url: '/tasks',
      ...formAutoContent({ name: taskName, statusId: '10' }),
      cookies: cookie,
    });

    t.equal(
      errorCreateResponse.statusCode,
      500,
      'POST /tasks with inconsistent data returns a status code of 500',
    );
  });

  test('update task', async (t) => {
    const { tasks: [task] } = testData;
    const cookie = await authenticateUser(app, defaultUser);
    const location = app.reverse('tasks');

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '/tasks/1',
      ...formAutoContent({ name: task.name, statusId: '2' }),
      cookies: cookie,
    });
    const updatedTask = await models.task.query().findById(1);

    t.equal(updateResponse.statusCode, 302, 'PATCH /tasks/1 returns a status code of 302');
    t.equal(updateResponse.headers.location, location, `...and redirected to '${location}'`);
    t.equal(updatedTask.statusId, 2, 'task changed successfully');

    const failedUpdateResponse = await app.inject({
      method: 'PATCH',
      url: '/tasks/1',
      ...formAutoContent({ name: '', statusId: '1' }),
      cookies: cookie,
    });

    t.equal(
      failedUpdateResponse.statusCode,
      422,
      'PATCH /tasks/1 with invalid data returns a status code of 422',
    );

    const errorUpdateResponse = await app.inject({
      method: 'PATCH',
      url: '/tasks/1',
      ...formAutoContent({ name: task.name, statusId: '10' }),
      cookies: cookie,
    });

    t.equal(
      errorUpdateResponse.statusCode,
      500,
      'PATCH /tasks/1 with inconsistent data returns a status code of 500',
    );
  });

  test('delete task', async (t) => {
    const { users: [, taskAuthor], tasks: [deletingTask] } = testData;
    const cookie = await authenticateUser(app, defaultUser);
    const taskAuthorCookie = await authenticateUser(app, taskAuthor);
    const location = app.reverse('tasks');

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: '/tasks/1',
      cookies: taskAuthorCookie,
    });
    const tasks = await models.task.query();
    const actualTaskNames = tasks.map(({ name }) => name);
    const expectedTaskNames = testData.tasks
      .map(({ name }) => name)
      .filter((name) => name !== deletingTask.name);

    t.equal(deleteResponse.statusCode, 302, 'DELETE /tasks/1 returns a status code of 302');
    t.equal(deleteResponse.headers.location, location, `...and redirected to '${location}'`);
    t.same(actualTaskNames, expectedTaskNames, 'task deleted successfully');

    const failedDeleteResponse = await app.inject({
      method: 'DELETE',
      url: '/tasks/2',
      cookies: cookie,
    });

    t.equal(
      failedDeleteResponse.statusCode,
      422,
      'DELETE /tasks/2 while under unauthorized account returns a status code of 422',
    );
  });

  test('create label', async (t) => {
    const cookie = await authenticateUser(app, defaultUser);
    const location = app.reverse('labels');

    const labelName = casual.title;
    const createResponse = await app.inject({
      method: 'POST',
      url: '/labels',
      ...formAutoContent({ name: labelName }),
      cookies: cookie,
    });
    const label = await models.label.query().findOne({ name: labelName });

    t.equal(createResponse.statusCode, 302, 'POST /labels returns a status code of 302');
    t.equal(createResponse.headers.location, location, `...and redirected to '${location}'`);
    t.equal(label.name, labelName, 'new label added successfully');

    const failedCreateResponse = await app.inject({
      method: 'POST',
      url: '/labels',
      ...formAutoContent({ name: '' }),
      cookies: cookie,
    });

    t.equal(
      failedCreateResponse.statusCode,
      422,
      'POST /labels with invalid data returns a status code of 422',
    );
  });

  test('update label', async (t) => {
    const cookie = await authenticateUser(app, defaultUser);
    const location = app.reverse('labels');

    const newLabelName = casual.title;
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '/labels/1',
      ...formAutoContent({ name: newLabelName }),
      cookies: cookie,
    });
    const updatedLabel = await models.label.query().findById(1);

    t.equal(updateResponse.statusCode, 302, 'PATCH /labels/1 returns a status code of 302');
    t.equal(updateResponse.headers.location, location, `...and redirected to '${location}'`);
    t.equal(updatedLabel.name, newLabelName, 'label changed successfully');

    const failedUpdateResponse = await app.inject({
      method: 'PATCH',
      url: '/labels/1',
      ...formAutoContent({ name: '' }),
      cookies: cookie,
    });

    t.equal(
      failedUpdateResponse.statusCode,
      422,
      'PATCH /labels/1 with invalid data returns a status code of 422',
    );
  });

  test('delete label', async (t) => {
    const { labels: [deletingLabel] } = testData;
    const cookie = await authenticateUser(app, defaultUser);
    const location = app.reverse('labels');

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: '/labels/1',
      cookies: cookie,
    });
    const labels = await models.label.query();
    const actualLabelNames = labels.map(({ name }) => name);
    const expectedLabelNames = testData.labels
      .map(({ name }) => name)
      .filter((name) => name !== deletingLabel.name);

    t.equal(deleteResponse.statusCode, 302, 'DELETE /labels/1 returns a status code of 302');
    t.equal(deleteResponse.headers.location, location, `...and redirected to '${location}'`);
    t.same(actualLabelNames, expectedLabelNames, 'label deleted successfully');

    const failedDeleteResponse = await app.inject({
      method: 'DELETE',
      url: '/labels/2',
      cookies: cookie,
    });

    t.equal(
      failedDeleteResponse.statusCode,
      422,
      'DELETE /labels/2 on related entity returns a status code of 422',
    );
  });

  test('filter tasks', async (t) => {
    const cookie = await authenticateUser(app, defaultUser);
    const filterResponse1 = await app.inject({
      method: 'GET',
      url: '/tasks',
      query: {
        status: '2',
        executor: '3',
        label: '2',
      },
      cookies: cookie,
    });
    const filteredTaskIds1 = getTaskIdsFromHtml(filterResponse1.body);

    t.equal(filterResponse1.statusCode, 200, 'GET /tasks with query params returns a status code of 200');
    t.same(filteredTaskIds1, [1], 'filter by status, executor, label selects task with id 1 correctly');

    const filterResponse2 = await app.inject({
      method: 'GET',
      url: '/tasks',
      query: {
        status: '3',
        executor: '2',
        label: '3',
      },
      cookies: cookie,
    });
    const filteredTaskIds2 = getTaskIdsFromHtml(filterResponse2.body);

    t.same(filteredTaskIds2, [2], 'filter by status, executor, label selects task with id 2 correctly');

    const filterResponse3 = await app.inject({
      method: 'GET',
      url: '/tasks',
      query: {
        label: '3',
      },
      cookies: cookie,
    });
    const filteredTaskIds3 = getTaskIdsFromHtml(filterResponse3.body);

    t.same(filteredTaskIds3, [1, 2], 'filter for the same label selects tasks correctly');

    const { users: [, taskCreator] } = testData;
    const creatorCookie = await authenticateUser(app, taskCreator);
    const filterResponse4 = await app.inject({
      method: 'GET',
      url: '/tasks',
      query: {
        label: '3',
        isCreatorUser: 'on',
      },
      cookies: creatorCookie,
    });
    const filteredTaskIds4 = getTaskIdsFromHtml(filterResponse4.body);

    t.same(filteredTaskIds4, [1], 'filter for the same label by creator selects the task correctly');
  });
});
