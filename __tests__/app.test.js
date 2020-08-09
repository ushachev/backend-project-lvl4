import getApp from '../server/index.js';

describe('requests', () => {
  let server;

  beforeAll(() => {
    server = getApp();
  });

  test('GET 200', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/',
    });
    expect(res.statusCode).toBe(200);
  });

  test('GET 404', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/wrong-path',
    });
    expect(res.statusCode).toBe(404);
  });

  afterAll(() => {
    server.close();
  });
});
