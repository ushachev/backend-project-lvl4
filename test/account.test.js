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
});
