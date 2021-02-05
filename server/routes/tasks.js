import { requireSignedIn } from '../lib/preHandlers.js';

export default async (app) => {
  const { models } = app.objection;

  const getTaskData = async (taskId) => {
    const task = await models.task.query().findById(taskId).select()
      .withGraphJoined('[status, creator, executor, labels]')
      .modifyGraph('[status, creator, executor, labels]', 'defaultSelects');

    return task;
  };

  const getTaskRelatedData = async () => {
    const users = await models.user.query().modify('defaultSelects');
    const statuses = await models.status.query();
    const labels = await models.label.query();

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
      const { query } = request;
      const taskRelatedData = await getTaskRelatedData();
      const filteredTasks = await models.task.query()
        .modify('defaultSelects')
        .withGraphJoined('[status, creator, executor, labels(selectId)]')
        .modifyGraph('[status, creator, executor]', 'defaultSelects')
        .where(query.isCreatorUser ? { 'creator.id': request.currentUser.id } : {})
        .where(query.status ? { 'status.id': Number(query.status) } : {})
        .where(query.executor ? { 'executor.id': Number(query.executor) } : {});

      const filterByLabel = (task) => task.labels
        .map(({ id }) => id)
        .includes(Number(query.label));
      const tasks = query.label
        ? filteredTasks.filter(filterByLabel)
        : filteredTasks;

      reply.render('tasks/index', { tasks, ...taskRelatedData, query });

      return reply;
    })
    .get('/tasks/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const task = await getTaskData(request.params.id);
      reply.render('tasks/show', { task });

      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preHandler: requireSignedIn }, async (request, reply) => {
      const taskRelatedData = await getTaskRelatedData();
      reply.render('tasks/new', { ...taskRelatedData, values: { labelIds: [] }, errors: {} });

      return reply;
    })
    .get('/tasks/:id/edit', { preHandler: requireSignedIn }, async (request, reply) => {
      const values = await getTaskData(request.params.id);
      values.labelIds = values.labels.map(({ id }) => id);
      const taskRelatedData = await getTaskRelatedData();

      reply.render('tasks/edit', { ...taskRelatedData, values, errors: {} });

      return reply;
    })
    .post('/tasks', { preHandler: requireSignedIn }, async (request, reply) => {
      const { labelIds, ...taskData } = normalizeTaskInputData(request.body);

      try {
        await models.task.transaction(async (trx) => {
          const task = await models.user.relatedQuery('createdTasks', trx)
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
      const task = await models.task.query().findById(request.params.id);
      const { labelIds, ...taskData } = normalizeTaskInputData(request.body);

      try {
        await models.task.transaction(async (trx) => {
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
      const task = await getTaskData(request.params.id);

      if (task.creatorId !== request.currentUser.id) {
        request.flash('danger', request.t('flash.tasks.delete.authorship'));
        reply.code(422).render('tasks/show', { task });

        return reply;
      }

      try {
        await models.task.transaction(async (trx) => {
          await task.$relatedQuery('labels', trx).unrelate();
          await task.$query(trx).delete();
        });

        request.flash('info', request.t('flash.tasks.delete.success', { name: task.name }));
        reply.redirect(app.reverse('tasks'));

        return reply;
      } catch (error) {
        request.rollbar(error);

        request.flash('danger', request.t('flash.tasks.delete.error', { name: task.name }));
        reply.code(422).render('tasks/show', { task });

        return reply;
      }
    });
};
