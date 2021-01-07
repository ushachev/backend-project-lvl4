import { requireSignedIn } from '../lib/preHandlers.js';

export default async (app) => {
  app
    .get('/taskStatuses', { name: 'taskStatuses', preHandler: requireSignedIn }, async (request, reply) => {
      const taskStatuses = await app.objection.models.taskStatus.query();
      reply.render('taskStatuses/index', { taskStatuses });
      return reply;
    })
    .get('/taskStatuses/:id/edit', { preHandler: requireSignedIn }, async (request, reply) => {
      const taskStatus = await app.objection.models.taskStatus.query().findById(request.params.id);
      reply.render('taskStatuses/edit', { values: taskStatus });
      return reply;
    })
    .post('/taskStatuses', { preHandler: requireSignedIn }, async (request, reply) => {
      try {
        const taskStatus = await app.objection.models.taskStatus.fromJson(request.body);
        await app.objection.models.taskStatus.query().insert(taskStatus);
        request.flash('info', request.t('flash.taskStatuses.create.success', { ...request.body }));
        reply.redirect(app.reverse('taskStatuses'));

        return reply;
      } catch ({ data }) {
        const taskStatuses = await app.objection.models.taskStatus.query();
        reply.code(422).render('taskStatuses/index', { taskStatuses, values: request.body, errors: data });
        return reply;
      }
    })
    .patch('/taskStatuses/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const taskStatus = await app.objection.models.taskStatus.query().findById(request.params.id);

      try {
        const newName = request.body.name;
        const oldName = taskStatus.name;

        await taskStatus.$query().patch({ name: newName });
        request.flash('info', request.t('flash.taskStatuses.edit.success', { oldName, newName }));
        reply.redirect(app.reverse('taskStatuses'));

        return reply;
      } catch ({ data }) {
        request.flash('danger', request.t('flash.taskStatuses.edit.error', { name: taskStatus.name }));
        const values = { id: request.params.id, name: request.body.name };
        reply.code(422).render('taskStatuses/edit', { values, errors: data });
        return reply;
      }
    })
    .delete('/taskStatuses/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const taskStatus = await app.objection.models.taskStatus.query().findById(request.params.id);
      await taskStatus.$query().delete();
      request.flash('info', request.t('flash.taskStatuses.delete.success', { name: taskStatus.name }));
      reply.redirect(app.reverse('taskStatuses'));

      return reply;
    });
};
