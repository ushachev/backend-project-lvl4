import fastify from 'fastify';

export default () => {
  const app = fastify({
    logger: true,
  });
  app.get('/', async (request, reply) => {
    return { hello: 'world!!!11one' };
  });

  return app;
};
