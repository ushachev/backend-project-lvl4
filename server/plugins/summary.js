import fp from 'fastify-plugin';

export default fp(async (app) => {
  app.decorateRequest('summary', null);
  app.addHook('preHandler', async (request) => {
    if (request.isAuthenticated()) {
      const users = await app.objection.models.user.query();
      const tasks = await app.objection.models.task.query();

      request.summary = {
        users: users.length,
        tasks: tasks.length,
      };
    } else {
      request.summary = null;
    }
  });
});
