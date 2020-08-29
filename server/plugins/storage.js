import fp from 'fastify-plugin';

const storage = [];

export default fp(async (app) => {
  app.decorate('save', (item) => {
    storage.push(item);
  });

  app.decorate('read', () => storage);
});
