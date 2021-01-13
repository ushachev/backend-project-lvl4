import objection from 'objection';
import { requireSignedIn } from '../lib/preHandlers.js';

const { raw } = objection;

export default async (app) => {
  const getTaskData = async (taskId) => {
    const task = await app.objection.models.task.query().findById(taskId)
      .select(
        { id: 'tasks.id' },
        { name: 'tasks.name' },
        { description: 'tasks.description' },
        { statusId: 'tasks.statusId' },
        { status: 'status.name' },
        { creatorId: 'tasks.creatorId' },
        { executorId: 'tasks.executorId' },
        { creator: raw('?? || ? || ??', 'creator.firstName', ' ', 'creator.lastName') },
        { executor: raw('?? || ? || ??', 'executor.firstName', ' ', 'executor.lastName') },
        { createdAt: 'tasks.createdAt' },
      )
      .leftJoinRelated('[status, creator, executor]');
    const labels = await task.$relatedQuery('labels').select(
      { id: 'labels.id' },
      { name: 'labels.name' },
    );

    return { task, labels };
  };

  const getTaskRelatedData = async () => {
    const users = await app.objection.models.user.query().select(
      { id: 'users.id' },
      { fullName: raw('?? || ? || ??', 'users.firstName', ' ', 'users.lastName') },
    );
    const statuses = await app.objection.models.status.query();
    const labels = await app.objection.models.label.query();

    return { users, statuses, labels };
  };

  const normalizeTaskInputData = (data) => ({
    name: data.name,
    description: data.description,
    executorId: Number(data.executorId) || null,
    statusId: Number(data.statusId),
    labelIds: [data.labelIds].flat().map(Number).filter((n) => n),
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
      const { task, labels } = await getTaskData(request.params.id);
      reply.render('tasks/show', { task: { ...task, labelNames: labels.map(({ name }) => name) } });

      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preHandler: requireSignedIn }, async (request, reply) => {
      const taskRelatedData = await getTaskRelatedData();
      reply.render('tasks/new', { ...taskRelatedData, values: { labelIds: [] }, errors: {} });

      return reply;
    })
    .get('/tasks/:id/edit', { preHandler: requireSignedIn }, async (request, reply) => {
      const { task, labels } = await getTaskData(request.params.id);
      const taskRelatedData = await getTaskRelatedData();
      const values = { ...task, labelIds: labels.map(({ id }) => id) };

      reply.render('tasks/edit', { ...taskRelatedData, values, errors: {} });

      return reply;
    })
    .post('/tasks', { preHandler: requireSignedIn }, async (request, reply) => {
      const { labelIds, ...taskData } = normalizeTaskInputData(request.body);

      try {
        await app.objection.models.task.transaction(async (trx) => {
          const task = await app.objection.models.user.relatedQuery('createdTasks', trx)
            .for(request.currentUser.id)
            .insert(taskData);
          await Promise.all(labelIds.map((id) => task.$relatedQuery('labels', trx).relate(id)));
        });

        request.flash('info', request.t('flash.tasks.create.success', { name: taskData.name }));
        reply.redirect(app.reverse('tasks'));

        return reply;
      } catch (error) {
        if (error.type !== 'ModelValidation') {
          throw error;
        }
        const taskRelatedData = await getTaskRelatedData();
        const values = { ...taskData, labelIds };

        reply.code(422)
          .render('tasks/new', { ...taskRelatedData, values, errors: error.data });

        return reply;
      }
    })
    .patch('/tasks/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const task = await app.objection.models.task.query().findById(request.params.id);
      const { labelIds, ...taskData } = normalizeTaskInputData(request.body);

      try {
        await app.objection.models.task.transaction(async (trx) => {
          await task.$query(trx).patch(taskData);
          await task.$relatedQuery('labels', trx).unrelate();
          await Promise.all(labelIds.map((id) => task.$relatedQuery('labels', trx).relate(id)));
        });

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
          values: { id: task.id, ...taskData, labelIds },
          errors: error.data,
        });

        return reply;
      }
    })
    .delete('/tasks/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const { task, labels } = await getTaskData(request.params.id);

      if (task.creatorId !== request.currentUser.id) {
        const labelNames = labels.map(({ name }) => name);
        request.flash('danger', request.t('flash.tasks.delete.authorship'));
        reply.code(422).render('tasks/show', { task: { ...task, labelNames } });

        return reply;
      }

      await app.objection.models.task.transaction(async (trx) => {
        await task.$relatedQuery('labels', trx).unrelate();
        await task.$query(trx).delete();
      });

      request.flash('info', request.t('flash.tasks.delete.success', { name: task.name }));
      reply.redirect(app.reverse('tasks'));

      return reply;
    });
};
