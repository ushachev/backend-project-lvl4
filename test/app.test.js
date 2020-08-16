import tap from 'tap';
import getApp from '../server/index.js';

tap.test('requests route:', async (t) => {
  const app = getApp();

  t.tearDown(() => app.close());

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });
  t.equal(response.statusCode, 200, '"/" returns a status code of 200');

  const response2 = await app.inject({
    method: 'GET',
    url: '/wrong-path',
  });
  t.equal(response2.statusCode, 404, '"/wrong-path" returns a status code of 404');

  const response3 = await app.inject({
    method: 'GET',
    url: '/throw',
  });
  t.equal(response3.statusCode, 500, '"/throw" returns a status code of 500');
});
