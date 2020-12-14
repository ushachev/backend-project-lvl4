import objection from 'objection';
import { requireSignedIn } from '../lib/preHandlers.js';

const { raw } = objection;

export default async (app) => {
  const getTaskReadyForView = async (id) => {
    const task = await app.objection.models.task.query().findById(id)
      .select(
        { id: 'tasks.id' },
        { name: 'tasks.name' },
        { description: 'tasks.description' },
        { status: 'status.name' },
        { creatorId: 'tasks.creatorId' },
        { creator: raw('?? || ? || ??', 'creator.firstName', ' ', 'creator.lastName') },
        { executor: raw('?? || ? || ??', 'executor.firstName', ' ', 'executor.lastName') },
        { createdAt: 'tasks.createdAt' },
      )
      .leftJoinRelated('[status, creator, executor]');

    return task;
  };

  const getTaskRelatedData = async () => {
    const users = await app.objection.models.user.query().select(
      { id: 'users.id' },
      { fullName: raw('?? || ? || ??', 'users.firstName', ' ', 'users.lastName') },
    );
    const taskStatuses = await app.objection.models.taskStatus.query();

    return { users, taskStatuses };
  };

  const normalizeTaskData = (data) => ({
    name: data.name,
    description: data.description,
    executorId: Number(data.executorId) || null,
    statusId: Number(data.statusId),
  });

  app
    .get('/tasks', { name: 'tasks', preHandler: requireSignedIn }, async (request, reply) => {
      const tasks = await app.objection.models.task.query()
        .select(
          { id: 'tasks.id' },
          { name: 'tasks.name' },
          { status: 'status.name' },
          { creator: raw('?? || ? || ??', 'creator.firstName', ' ', 'creator.lastName') },
          { executor: raw('?? || ? || ??', 'executor.firstName', ' ', 'executor.lastName') },
          { createdAt: 'tasks.createdAt' },
        )
        .leftJoinRelated('[status, creator, executor]');
      reply.render('tasks/index', { tasks });

      return reply;
    })
    .get('/tasks/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const task = await getTaskReadyForView(request.params.id);
      reply.render('tasks/show', { task });

      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preHandler: requireSignedIn }, async (request, reply) => {
      const taskRelatedData = await getTaskRelatedData();
      reply.render('tasks/new', { ...taskRelatedData, values: {}, errors: {} });

      return reply;
    })
    .get('/tasks/:id/edit', { preHandler: requireSignedIn }, async (request, reply) => {
      const task = await app.objection.models.task.query().findById(request.params.id);
      const taskRelatedData = await getTaskRelatedData();
      reply.render('tasks/edit', { ...taskRelatedData, values: task, errors: {} });

      return reply;
    })
    .post('/tasks', { preHandler: requireSignedIn }, async (request, reply) => {
      try {
        const taskData = normalizeTaskData(request.body);

        await app.objection.models.user.relatedQuery('createdTask')
          .for(request.currentUser.id)
          .insert(taskData);
        request.flash('info', request.t('flash.tasks.create.success', { name: taskData.name }));
        reply.redirect(app.reverse('tasks'));

        return reply;
      } catch (error) {
        if (error.type !== 'ModelValidation') {
          throw error;
        }
        const taskRelatedData = await getTaskRelatedData();
        reply.code(422)
          .render('tasks/new', { ...taskRelatedData, values: request.body, errors: error.data });

        return reply;
      }
    })
    .patch('/tasks/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const task = await app.objection.models.task.query().findById(request.params.id);

      try {
        const taskData = normalizeTaskData(request.body);

        await task.$query().patch(taskData);
        request.flash('info', request.t('flash.tasks.edit.success', { name: taskData.name }));
        reply.redirect(app.reverse('tasks'));

        return reply;
      } catch (error) {
        if (error.type !== 'ModelValidation') {
          throw error;
        }
        const taskRelatedData = await getTaskRelatedData();

        request.flash('danger', request.t('flash.tasks.edit.error', { name: task.name }));
        reply.code(422).render('tasks/edit', {
          ...taskRelatedData,
          values: { id: task.id, ...request.body },
          errors: error.data,
        });

        return reply;
      }
    })
    .delete('/tasks/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const task = await getTaskReadyForView(request.params.id);

      if (task.creatorId !== request.currentUser.id) {
        request.flash('danger', request.t('flash.tasks.delete.authorship'));
        reply.code(422).render('tasks/show', { task });

        return reply;
      }

      await task.$query().delete();
      request.flash('info', request.t('flash.tasks.delete.success', { name: task.name }));
      reply.redirect(app.reverse('tasks'));

      return reply;
    });
};
