import casual from 'casual';
import formAutoContent from 'form-auto-content';
import getApp from '../server/index.js';
import authenticateUser from './helpers/authentication.js';
import testData from './helpers/testData.js';
import encrypt from '../server/lib/secure.js';

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

describe('register new user', () => {
  const passwordValue = casual.password;
  const signUpData = {
    firstName: casual.first_name,
    lastName: casual.last_name,
    email: casual.email,
    password: passwordValue,
    repeatedPassword: passwordValue,
  };

  test('POST /users with valid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      ...formAutoContent(signUpData),
    });
    const user = await models.user.query().findOne({ email: signUpData.email });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('newSession'));
    expect(user.email).toBe(signUpData.email);
  });

  test('POST /users with invalid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      ...formAutoContent({ ...signUpData, repeatedPassword: '' }),
    });
    const expectedHtml = '<div class="invalid-feedback">должно совпадать с паролем</div>';

    expect(response.statusCode).toBe(422);
    expect(response.body).toEqual(expect.stringContaining(expectedHtml));
  });
});

describe('sign in / sign out user', () => {
  test('sign in / sign out with valid data', async () => {
    const { users: [user] } = testData;
    const signInResponse = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      ...formAutoContent({ email: user.email, password: user.password }),
    });

    expect(signInResponse.statusCode).toBe(302);

    const cookieHeader = signInResponse.headers['set-cookie'];
    const signedInRootResponse = await app.inject({
      method: 'GET',
      url: app.reverse('root'),
      headers: { cookie: cookieHeader },
    });
    const expectedHtml = `<span>приветствуем, ${user.firstName} ${user.lastName}</span>`;

    expect(signedInRootResponse.body).toEqual(expect.stringContaining(expectedHtml));

    const signOutResponse = await app.inject({
      method: 'DELETE',
      url: app.reverse('session'),
      headers: { cookie },
    });

    expect(signOutResponse.statusCode).toBe(302);
  });

  test('sign in with unregistered data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      ...formAutoContent({
        email: casual.email,
        password: casual.password,
      }),
    });

    expect(response.statusCode).toBe(422);
  });
});

describe('update user', () => {
  const newLastName = casual.last_name;
  const newPassword = casual.password;
  const changedPasswordData = {
    currentPassword: defaultUser.password,
    password: newPassword,
    repeatedPassword: newPassword,
  };

  test('PATCH /user/profile with valid data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('userProfile'),
      ...formAutoContent({ firstName: defaultUser.firstName, lastName: newLastName }),
      cookies: cookie,
    });
    const changedUser = await models.user.query().findById(1);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('userAccount'));
    expect(changedUser.lastName).toBe(newLastName);
  });

  test('PATCH /user/profile with invalid data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('userProfile'),
      ...formAutoContent({ firstName: '', lastName: newLastName }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });

  test('PATCH /user/password with valid data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('userPassword'),
      ...formAutoContent(changedPasswordData),
      cookies: cookie,
    });
    const changedUser = await models.user.query().findById(1);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('userAccount'));
    expect(changedUser.passwordDigest).toBe(encrypt(newPassword));
  });

  test('PATCH /user/password with invalid data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('userPassword'),
      ...formAutoContent({ ...changedPasswordData, currentPassword: '' }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(422);
  });
});

describe('delete user', () => {
  test('DELETE /user', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('userAccount'),
      cookies: cookie,
    });
    const users = await models.user.query();
    const actualUserEmails = users.map(({ email }) => email);
    const expectedUserEmails = testData.users
      .map(({ email }) => email)
      .filter((email) => email !== defaultUser.email);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(app.reverse('root'));
    expect(actualUserEmails).toEqual(expectedUserEmails);
  });

  test('DELETE /user on related user', async () => {
    const { users: [, relatedUser] } = testData;
    const relatedUserCookie = await authenticateUser(app, relatedUser);
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('userAccount'),
      cookies: relatedUserCookie,
    });

    expect(response.statusCode).toBe(422);
  });
});
