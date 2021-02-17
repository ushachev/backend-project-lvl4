import { isEmpty } from 'lodash';

export default async (app) => {
  const { models } = app.objection;

  app
    .get('/statuses', { name: 'statuses', preValidation: app.authenticate }, async (request, reply) => {
      const statuses = await models.status.query();
      reply.render('statuses/index', { statuses });
      return reply;
    })
    .get(
      '/statuses/:id/edit',
      { name: 'editStatus', preValidation: app.authenticate },
      async (request, reply) => {
        const status = await models.status.query().findById(request.params.id);
        reply.render('statuses/edit', { values: status });
        return reply;
      },
    )
    .post('/statuses', { preValidation: app.authenticate }, async (request, reply) => {
      try {
        const status = await models.status.fromJson(request.body);
        await models.status.query().insert(status);
        request.flash('info', request.t('flash.statuses.create.success', { ...request.body }));
        reply.redirect(app.reverse('statuses'));

        return reply;
      } catch ({ data }) {
        const statuses = await models.status.query();
        reply.code(422).render('statuses/index', { statuses, values: request.body, errors: data });
        return reply;
      }
    })
    .patch(
      '/statuses/:id',
      { name: 'status', preValidation: app.authenticate },
      async (request, reply) => {
        const status = await models.status.query().findById(request.params.id);

        try {
          const newName = request.body.name;
          const oldName = status.name;

          await status.$query().patch({ name: newName });
          request.flash('info', request.t('flash.statuses.edit.success', { oldName, newName }));
          reply.redirect(app.reverse('statuses'));

          return reply;
        } catch ({ data }) {
          request.flash('error', request.t('flash.statuses.edit.error', { name: status.name }));
          const values = { id: request.params.id, name: request.body.name };
          reply.code(422).render('statuses/edit', { values, errors: data });
          return reply;
        }
      },
    )
    .delete('/statuses/:id', { preValidation: app.authenticate }, async (request, reply) => {
      const status = await models.status.query().findById(request.params.id)
        .withGraphJoined('[tasks]');

      if (isEmpty(status.tasks)) {
        await status.$query().delete();
        request.flash('info', request.t('flash.statuses.delete.success', { name: status.name }));
        reply.redirect(app.reverse('statuses'));

        return reply;
      }

      const statuses = await models.status.query();

      request.flash('error', request.t('flash.statuses.delete.error'));
      reply.code(422).render('statuses/index', { statuses });

      return reply;
    });
};
