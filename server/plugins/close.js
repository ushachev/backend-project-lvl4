import fp from 'fastify-plugin';

export default fp(async (app) => {
  app.addHook('onClose', (_instance, done) => {
    app.log.info('app closed');
    done();
  });
});
