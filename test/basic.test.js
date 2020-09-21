import tap from 'tap';
import getApp from '../server/index.js';

tap.test('server main answers test', async (subTest) => {
  const { test } = subTest;
  const app = getApp();

  subTest.tearDown(() => app.close());

  test('"/"', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });
    t.equal(response.statusCode, 200, 'returns a status code of 200');
  });

  test('"/wrong-path"', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/wrong-path',
    });
    t.equal(response.statusCode, 404, 'returns a status code of 404');
  });

  test('"/throw"', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/throw',
    });
    t.equal(response.statusCode, 500, 'returns a status code of 500');
  });
});
