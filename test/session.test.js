import tap from 'tap';
import formAutoContent from 'form-auto-content';
import getApp from '../server/index.js';

tap.test('"/session" route actions:', async (t) => {
  const app = getApp();

  t.tearDown(() => app.close());

  const request1 = {
    method: 'GET',
    url: '/session/new',
  };
  const testName1 = `'${request1.method} ${request1.url}' returns a status code of 200`;
  const response1 = await app.inject(request1);
  t.equal(response1.statusCode, 200, testName1);

  const signUpData = {
    email: 'qaz@wsx.com',
    password: '123',
    repeatedPassword: '123',
  };
  const request2 = {
    method: 'POST',
    url: '/users',
    ...formAutoContent(signUpData),
  };
  await app.inject(request2);

  const wrongSignInData = {
    email: signUpData.email,
    password: '321',
  };
  const request3 = {
    method: 'POST',
    url: '/session',
    ...formAutoContent(wrongSignInData),
  };
  const testName2 = `'${request3.method} ${request3.url}' with wrong data returns a status code of 422`;
  const response2 = await app.inject(request3);
  t.equal(response2.statusCode, 422, testName2);

  const rightSignInData = {
    email: signUpData.email,
    password: signUpData.password,
  };
  const request4 = {
    method: 'POST',
    url: '/session',
    ...formAutoContent(rightSignInData),
  };

  const testName3 = `'${request4.method} ${request4.url}' with right data returns a status code of 302`;
  const response3 = await app.inject(request4);
  t.equal(response3.statusCode, 302, testName3);
  const cookie = response3.headers['set-cookie'];

  const request5 = {
    method: 'GET',
    url: '/',
    headers: { cookie },
  };
  const expectedHtml = `<span>${signUpData.email}</span>`;
  const testName4 = `'${request5.method} ${request5.url}' after authentication returns body containing '${expectedHtml}'`;
  const response4 = await app.inject(request5);
  t.has(response4.body, expectedHtml, testName4);

  const request6 = {
    method: 'DELETE',
    url: '/session',
    headers: { cookie },
  };
  const testName5 = `'${request6.method} ${request6.url}' returns a status code of 302`;
  const response5 = await app.inject(request6);
  t.equal(response5.statusCode, 302, testName5);
});
