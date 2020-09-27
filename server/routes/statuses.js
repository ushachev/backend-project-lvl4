import { requireSignedIn } from '../lib/preHandlers.js';

export default async (app) => {
  app
    .get('/taskStatuses', { name: 'taskStatuses', preHandler: requireSignedIn }, async (request, reply) => {
      const taskStatuses = await app.objection.models.taskStatus.query();
      reply.render('/pages/taskStatuses', { taskStatuses });
      return reply;
    })
    .get('/taskStatuses/:id/edit', { preHandler: requireSignedIn }, async (request, reply) => {
      const taskStatus = await app.objection.models.taskStatus.query().findById(request.params.id);
      reply.render('/pages/editTaskStatus', { values: taskStatus });
      return reply;
    })
    .post('/taskStatuses', { preHandler: requireSignedIn }, async (request, reply) => {
      try {
        const taskStatus = await app.objection.models.taskStatus.fromJson(request.body);
        await app.objection.models.taskStatus.query().insert(taskStatus);
        request.flash('info', `статус '${request.body.name}' успешно добавлен`);
        reply.redirect(app.reverse('taskStatuses'));

        return reply;
      } catch ({ data }) {
        const taskStatuses = await app.objection.models.taskStatus.query();
        reply.code(422).render('pages/taskStatuses', { taskStatuses, values: request.body, errors: data });
        return reply;
      }
    })
    .patch('/taskStatuses/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const taskStatus = await app.objection.models.taskStatus.query().findById(request.params.id);

      try {
        const { name: newName } = request.body;
        const { name: oldName } = taskStatus;

        await taskStatus.$query().patch({ name: newName });
        request.flash('info', `значение статуса '${oldName}' изменено на '${newName}'`);
        reply.redirect(app.reverse('taskStatuses'));

        return reply;
      } catch ({ data }) {
        request.flash('danger', `не получилось изменить статус '${taskStatus.name}'`);
        reply.code(422).render('pages/editStatus', { values: request.body, errors: data });
        return reply;
      }
    })
    .delete('/taskStatuses/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const taskStatus = await app.objection.models.taskStatus.query().findById(request.params.id);
      await taskStatus.$query().delete();
      request.flash('info', `статус '${taskStatus.name}' удалён`);
      reply.redirect(app.reverse('taskStatuses'));

      return reply;
    });
};
