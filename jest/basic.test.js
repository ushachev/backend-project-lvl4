import getApp from '../server/index.js';

describe('server main answers test:', () => {
  let app;

  beforeAll(async () => {
    app = await getApp();
  });

  test('GET / returns a status code of 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('root'),
    });
    expect(response.statusCode).toBe(200);
  });

  test('GET /wrong-path returns a status code of 404', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/wrong-path',
    });
    expect(response.statusCode).toBe(404);
  });

  afterAll(() => {
    app.close();
  });
});
