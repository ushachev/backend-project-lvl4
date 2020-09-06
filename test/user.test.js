import tap from 'tap';
import formAutoContent from 'form-auto-content';
import { merge } from 'lodash';
import getApp from '../server/index.js';

tap.test('"/user" route actions:', async (t) => {
  const app = getApp();

  t.tearDown(() => app.close());

  const signUpData = {
    firstName: 'Виталий',
    lastName: 'Ушачёв',
    email: 'qaz@wsx.com',
    password: '123',
    repeatedPassword: '123',
  };
  const request1 = {
    method: 'POST',
    url: '/users',
    ...formAutoContent(signUpData),
  };
  await app.inject(request1);

  const request2 = {
    method: 'POST',
    url: '/session',
    ...formAutoContent({ email: signUpData.email, password: signUpData.password }),
  };
  const response1 = await app.inject(request2);
  const cookie = response1.headers['set-cookie'];

  const request3 = {
    method: 'GET',
    url: '/user',
    headers: { cookie },
  };
  const testName1 = `'${request3.method} ${request3.url}' returns a status code of 200`;
  const response2 = await app.inject(request3);
  t.equal(response2.statusCode, 200, testName1);

  const changedProfileData = {
    firstName: 'Джон',
    lastName: 'Сноу',
  };
  const request4 = {
    method: 'PATCH',
    url: '/user/profile',
    ...merge(formAutoContent(changedProfileData), { headers: { cookie } }),
  };
  const testName2 = `'${request4.method} ${request4.url}' returns a status code of 302`;
  const response3 = await app.inject(request4);
  t.equal(response3.statusCode, 302, testName2);

  const changedPasswordData = {
    password: signUpData.password,
    newPassword: '321',
    repeatedNewPassword: '321',
  };
  const request5 = {
    method: 'PATCH',
    url: '/user/password',
    ...merge(formAutoContent(changedPasswordData), { headers: { cookie } }),
  };
  const testName3 = `'${request5.method} ${request5.url}' returns a status code of 302`;
  const response4 = await app.inject(request5);
  t.equal(response4.statusCode, 302, testName3);

  const request6 = {
    method: 'GET',
    url: '/users',
  };
  const testName4 = `'${request6.method} ${request6.url}' returns changed data`;
  const response5 = await app.inject(request6);
  const expectedData = {
    id: 1,
    firstName: changedProfileData.firstName,
    lastName: changedProfileData.lastName,
    email: signUpData.email,
    password: changedPasswordData.newPassword,
  };
  t.same(JSON.parse(response5.body), [expectedData], testName4);

  const request7 = {
    method: 'DELETE',
    url: '/user',
    headers: { cookie },
  };
  const testName5 = `'${request7.method} ${request7.url}' returns a status code of 302`;
  const response6 = await app.inject(request7);
  t.equal(response6.statusCode, 302, testName5);
  const updatedCookie = response6.headers['set-cookie'];

  const request8 = {
    method: 'GET',
    url: '/users',
  };
  const testName6 = `'${request8.method} ${request8.url}' returns empty data`;
  const response7 = await app.inject(request8);
  t.same(JSON.parse(response7.body), [], testName6);

  const request9 = {
    method: 'GET',
    url: '/user',
    headers: { cookie: updatedCookie },
  };
  const testName7 = `'${request9.method} ${request9.url}' after deleting account returns a status code of 302`;
  const response8 = await app.inject(request9);
  t.equal(response8.statusCode, 302, testName7);
});
