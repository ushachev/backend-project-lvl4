import tap from 'tap';
import faker from 'faker';
import formAutoContent from 'form-auto-content';
import getApp from '../server/index.js';

tap.test('"/users" route actions:', async (t) => {
  const app = getApp();

  t.tearDown(() => app.close());

  const request1 = {
    method: 'GET',
    url: '/users/new',
  };
  const testName1 = `'${request1.method} ${request1.url}' returns a status code of 200`;
  const response1 = await app.inject(request1);
  t.equal(response1.statusCode, 200, testName1);

  const password = faker.internet.password();
  const signUpData = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password,
    repeatedPassword: password,
  };
  const request2 = {
    method: 'POST',
    url: '/users',
    ...formAutoContent(signUpData),
  };
  const testName2 = `'${request2.method} ${request2.url}' returns a status code of 302`;
  const response2 = await app.inject(request2);
  t.equal(response2.statusCode, 302, testName2);

  const wrongSignUpData = { ...signUpData, repeatedPassword: '' };
  const request3 = {
    method: 'POST',
    url: '/users',
    ...formAutoContent(wrongSignUpData),
  };
  const testName3 = `'${request3.method} ${request3.url}' with invalid data returns a status code of 422`;
  const response3 = await app.inject(request3);
  t.equal(response3.statusCode, 422, testName3);

  const expectedHtml = '<div class="invalid-feedback">должно совпадать с паролем</div>';
  const testName4 = `'${request3.method} ${request3.url}' with invalid data returns body containing '${expectedHtml}'`;
  t.has(response3.body, expectedHtml, testName4);

  const request4 = {
    method: 'POST',
    url: '/session',
    ...formAutoContent({ email: signUpData.email, password: signUpData.password }),
  };
  const response4 = await app.inject(request4);
  const cookie = response4.headers['set-cookie'];

  const request5 = {
    method: 'GET',
    url: '/users',
    headers: { cookie },
  };
  const testName5 = `'${request5.method} ${request5.url}' returns body containing posted data`;
  const response5 = await app.inject(request5);
  const expectedHtml2 = `<td>${signUpData.firstName} ${signUpData.lastName}</td><td>${signUpData.email}</td>`;
  t.has(response5.body, expectedHtml2, testName5);
});
