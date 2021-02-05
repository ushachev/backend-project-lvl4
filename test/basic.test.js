import tap from 'tap';
import getApp from '../server/index.js';

tap.test('server main answers test:', async (subTest) => {
  const { test } = subTest;
  const app = getApp();

  subTest.tearDown(() => app.close());

  test(async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });
    t.equal(response.statusCode, 200, 'GET / returns a status code of 200');
  });

  test(async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/wrong-path',
    });
    t.equal(response.statusCode, 404, 'GET /wrong-path returns a status code of 404');
  });
});
