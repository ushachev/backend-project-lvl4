import fp from 'fastify-plugin';

let storage = [];

export default fp(async (app) => {
  app.decorate('save', (item) => {
    storage.push(item);
  });
  app.decorate('read', () => storage);
  app.decorate('update', (updatedStorage) => {
    storage = updatedStorage;
  });
});
