import tap from 'tap';
import casual from 'casual';
import formAutoContent from 'form-auto-content';
import { merge } from 'lodash';
import getApp from '../server/index.js';

tap.test('users CRUD test', async (subTest) => {
  const { test } = subTest;
  const app = getApp();

  subTest.tearDown(() => app.close());

  test('GET /users/new availability:', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/new',
    });
    t.equal(response.statusCode, 200, 'a status code of 200 returned');
  });

  test('GET /session/new availability:', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/session/new',
    });
    t.equal(response.statusCode, 200, 'a status code of 200 returned');
  });

  test('POST /users with invalid data:', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      ...formAutoContent({
        firstName: casual.first_name,
        lastName: casual.last_name,
        email: casual.email,
        password: casual.password,
        repeatedPassword: '',
      }),
    });
    const expectedHtml = '<div class="invalid-feedback">должно совпадать с паролем</div>';

    t.equal(response.statusCode, 422, 'a status code of 422 returned');
    t.has(response.body, expectedHtml, `body containing '${expectedHtml}' returned`);
  });

  test('POST /session with unregistered data', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/session',
      ...formAutoContent({
        email: casual.email,
        password: casual.password,
      }),
    });
    t.equal(response.statusCode, 422, 'a status code of 422 returned');
  });

  test('CRUD flow with valid data test:', async (t) => {
    const passwordValue = casual.password;
    const signUpData = {
      firstName: casual.first_name,
      lastName: casual.last_name,
      email: casual.email,
      password: passwordValue,
      repeatedPassword: passwordValue,
    };

    const registrationResponse = await app.inject({
      method: 'POST',
      url: '/users',
      ...formAutoContent(signUpData),
    });
    t.equal(registrationResponse.statusCode, 302, 'POST /users returns a status code of 302');

    const authenticationResponse = await app.inject({
      method: 'POST',
      url: '/session',
      ...formAutoContent({
        email: signUpData.email,
        password: signUpData.password,
      }),
    });
    t.equal(authenticationResponse.statusCode, 302, 'POST /session returns a status code of 302');

    const cookie = authenticationResponse.headers['set-cookie'];

    const signedInRootResponse = await app.inject({
      method: 'GET',
      url: '/',
      headers: { cookie },
    });
    const expectedHtml = `<span>приветствуем, ${signUpData.firstName} ${signUpData.lastName}</span>`;
    t.has(signedInRootResponse.body, expectedHtml, `GET / returns body containing '${expectedHtml}'`);

    const usersResponse = await app.inject({
      method: 'GET',
      url: '/users',
      headers: { cookie },
    });
    const expectedHtml2 = `<td>${signUpData.firstName} ${signUpData.lastName}</td><td>${signUpData.email}</td>`;
    t.has(usersResponse.body, expectedHtml2, 'GET /users returns body containing registered data');

    const userResponse = await app.inject({
      method: 'GET',
      url: '/user',
      headers: { cookie },
    });
    t.equal(userResponse.statusCode, 200, 'GET /user returns a status code of 200');

    const changedProfileData = {
      firstName: casual.first_name,
      lastName: casual.last_name,
    };
    const changedProfileResponse = await app.inject({
      method: 'PATCH',
      url: '/user/profile',
      ...merge(formAutoContent(changedProfileData), { headers: { cookie } }),
    });
    t.equal(changedProfileResponse.statusCode, 302, 'PATCH /user/profile returns a status code of 302');

    const newPassword = casual.password;
    const changedPasswordData = {
      currentPassword: signUpData.password,
      password: newPassword,
      repeatedPassword: newPassword,
    };
    const changedPasswordResponse = await app.inject({
      method: 'PATCH',
      url: '/user/password',
      ...merge(formAutoContent(changedPasswordData), { headers: { cookie } }),
    });
    t.equal(changedPasswordResponse.statusCode, 302, 'PATCH /user/password returns a status code of 302');

    const changedUserResponse = await app.inject({
      method: 'GET',
      url: '/users',
      headers: { cookie },
    });
    const expectedHtml3 = `<td>${changedProfileData.firstName} ${changedProfileData.lastName}</td><td>${signUpData.email}</td>`;
    t.has(changedUserResponse.body, expectedHtml3, 'GET /users returns body containing changed data');

    const deleteUserResponse = await app.inject({
      method: 'DELETE',
      url: '/user',
      headers: { cookie },
    });
    t.equal(deleteUserResponse.statusCode, 302, 'DELETE /user returns a status code of 302');

    const signOutResponse = await app.inject({
      method: 'DELETE',
      url: '/session',
      headers: { cookie },
    });
    t.equal(signOutResponse.statusCode, 302, 'DELETE /session returns a status code of 302');
  });
});
