import tap from 'tap';
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

  const data1 = {
    email: 'qaz@wsx.com',
    password: '123',
    repeatedPassword: '123',
  };
  const request2 = {
    method: 'POST',
    url: '/users',
    ...formAutoContent(data1),
  };
  const testName2 = `'${request2.method} ${request2.url}' returns a status code of 302`;
  const response2 = await app.inject(request2);
  t.equal(response2.statusCode, 302, testName2);

  const data2 = {
    email: 'zaq@xsw.com',
    password: '321',
    repeatedPassword: '',
  };
  const request3 = {
    method: 'POST',
    url: '/users',
    ...formAutoContent(data2),
  };
  const testName3 = `'${request3.method} ${request3.url}' with invalid data returns a status code of 422`;
  const response3 = await app.inject(request3);
  t.equal(response3.statusCode, 422, testName3);

  const expectedHtml = '<div class="invalid-feedback">должно совпадать с паролем</div>';
  const testName4 = `'${request3.method} ${request3.url}' with invalid data returns body containing '${expectedHtml}'`;
  t.has(response3.body, expectedHtml, testName4);

  const request4 = {
    method: 'GET',
    url: '/users',
  };
  const testName5 = `'${request4.method} ${request4.url}' returns posted data`;
  const response4 = await app.inject(request4);
  const { repeatedPassword: _unneeded, ...expectedData } = data1;
  t.same(JSON.parse(response4.body), [expectedData], testName5);
});
