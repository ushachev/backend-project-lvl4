import tap from 'tap';
import casual from 'casual';
import formAutoContent from 'form-auto-content';
import getApp from '../server/index.js';
import authenticateUser from './testHelpers/authentication.js';
import testData from './testHelpers/testData.js';
import encrypt from '../server/lib/secure.js';

tap.test(async (subTest) => {
  const { test } = subTest;
  const app = await getApp();
  const { models, knex } = app.objection;

  subTest.tearDown(() => app.close());

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

  test('register new user', async (t) => {
    const passwordValue = casual.password;
    const signUpData = {
      firstName: casual.first_name,
      lastName: casual.last_name,
      email: casual.email,
      password: passwordValue,
      repeatedPassword: passwordValue,
    };
    const location = app.reverse('newSession');

    const registrationRes = await app.inject({
      method: 'POST',
      url: '/users',
      ...formAutoContent(signUpData),
    });
    const user = await models.user.query().findOne({ email: signUpData.email });

    t.equal(registrationRes.statusCode, 302, 'POST /users returns a status code of 302');
    t.equal(registrationRes.headers.location, location, `...and redirected to '${location}'`);
    t.equal(user.email, signUpData.email, `account ${signUpData.email} registered successfully`);

    const failedRegRes = await app.inject({
      method: 'POST',
      url: '/users',
      ...formAutoContent({ ...signUpData, repeatedPassword: '' }),
    });
    const expectedHtml = '<div class="invalid-feedback">должно совпадать с паролем</div>';

    t.equal(failedRegRes.statusCode, 422, 'POST /users with invalid data returns a status code of 422...');
    t.has(failedRegRes.body, expectedHtml, '... and the body returned with the expected html block');
  });

  test('sign in / sign out user', async (t) => {
    const { users: [user] } = testData;
    const signInResponse = await app.inject({
      method: 'POST',
      url: '/session',
      ...formAutoContent({ email: user.email, password: user.password }),
    });

    t.equal(signInResponse.statusCode, 302, 'POST /session returns a status code of 302');

    const cookie = signInResponse.headers['set-cookie'];
    const signedInRootResponse = await app.inject({
      method: 'GET',
      url: '/',
      headers: { cookie },
    });
    const expectedHtml = `<span>приветствуем, ${user.firstName} ${user.lastName}</span>`;

    t.has(signedInRootResponse.body, expectedHtml, 'GET / returns body containing expected html block');

    const signOutResponse = await app.inject({
      method: 'DELETE',
      url: '/session',
      headers: { cookie },
    });

    t.equal(signOutResponse.statusCode, 302, 'DELETE /session returns a status code of 302');

    const failedSignInRes = await app.inject({
      method: 'POST',
      url: '/session',
      ...formAutoContent({
        email: casual.email,
        password: casual.password,
      }),
    });
    t.equal(failedSignInRes.statusCode, 422, 'POST /session with unregistered data returns a status code of 422');
  });

  test('update user', async (t) => {
    const cookie = await authenticateUser(app, defaultUser);
    const location = app.reverse('userAccount');

    const newLastName = casual.last_name;
    const changeProfileResponse = await app.inject({
      method: 'PATCH',
      url: '/user/profile',
      ...formAutoContent({ firstName: defaultUser.firstName, lastName: newLastName }),
      cookies: cookie,
    });
    let changedUser = await models.user.query().findById(1);

    t.equal(changeProfileResponse.statusCode, 302, 'PATCH /user/profile returns a status code of 302');
    t.equal(changeProfileResponse.headers.location, location, `...and redirected to '${location}'`);
    t.equal(changedUser.lastName, newLastName, 'user profile changed successfully');

    const failedChangeProfileResponse = await app.inject({
      method: 'PATCH',
      url: '/user/profile',
      ...formAutoContent({ firstName: '', lastName: newLastName }),
      cookies: cookie,
    });

    t.equal(
      failedChangeProfileResponse.statusCode,
      422,
      'PATCH /user/profile with invalid data returns a status code of 422',
    );

    const newPassword = casual.password;
    const changedPasswordData = {
      currentPassword: defaultUser.password,
      password: newPassword,
      repeatedPassword: newPassword,
    };
    const changePasswordResponse = await app.inject({
      method: 'PATCH',
      url: '/user/password',
      ...formAutoContent(changedPasswordData),
      cookies: cookie,
    });
    changedUser = await models.user.query().findById(1);

    t.equal(changePasswordResponse.statusCode, 302, 'PATCH /user/password returns a status code of 302');
    t.equal(changePasswordResponse.headers.location, location, `...and redirected to '${location}'`);
    t.equal(changedUser.passwordDigest, encrypt(newPassword), 'user password changed successfully');

    const failedChangePasswordResponse = await app.inject({
      method: 'PATCH',
      url: '/user/password',
      ...formAutoContent({ ...changedPasswordData, currentPassword: '' }),
      cookies: cookie,
    });

    t.equal(
      failedChangePasswordResponse.statusCode,
      422,
      'PATCH /user/password with invalid data returns a status code of 422',
    );
  });

  test('delete user', async (t) => {
    const { users: [, relatedUser] } = testData;
    const cookie = await authenticateUser(app, defaultUser);
    const relatedUserCookie = await authenticateUser(app, relatedUser);
    const location = app.reverse('root');

    const deleteUserResponse = await app.inject({
      method: 'DELETE',
      url: '/user',
      cookies: cookie,
    });
    const users = await models.user.query();
    const actualUserEmails = users.map(({ email }) => email);
    const expectedUserEmails = testData.users
      .map(({ email }) => email)
      .filter((email) => email !== defaultUser.email);

    t.equal(deleteUserResponse.statusCode, 302, 'DELETE /user returns a status code of 302');
    t.equal(deleteUserResponse.headers.location, location, `...and redirected to '${location}'`);
    t.same(actualUserEmails, expectedUserEmails, 'user deleted successfully');

    const failDeleteUserResponse = await app.inject({
      method: 'DELETE',
      url: '/user',
      cookies: relatedUserCookie,
    });

    t.equal(
      failDeleteUserResponse.statusCode,
      422,
      'DELETE /user on related entity returns a status code of 422',
    );
  });

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
});
