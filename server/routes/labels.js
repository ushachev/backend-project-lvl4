import { isEmpty } from 'lodash';

export default async (app) => {
  const { models } = app.objection;

  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (request, reply) => {
      const labels = await models.label.query();
      reply.render('labels/index', { labels });
      return reply;
    })
    .get('/labels/:id/edit', { preValidation: app.authenticate }, async (request, reply) => {
      const label = await models.label.query().findById(request.params.id);
      reply.render('labels/edit', { values: label });
      return reply;
    })
    .post('/labels', { preValidation: app.authenticate }, async (request, reply) => {
      try {
        const label = await models.label.fromJson(request.body);
        await models.label.query().insert(label);
        request.flash('info', request.t('flash.labels.create.success', { ...request.body }));
        reply.redirect(app.reverse('labels'));

        return reply;
      } catch ({ data }) {
        const labels = await models.label.query();
        reply.code(422).render('labels/index', { labels, values: request.body, errors: data });
        return reply;
      }
    })
    .patch('/labels/:id', { preValidation: app.authenticate }, async (request, reply) => {
      const label = await models.label.query().findById(request.params.id);

      try {
        const newName = request.body.name;
        const oldName = label.name;

        await label.$query().patch({ name: newName });
        request.flash('info', request.t('flash.labels.edit.success', { oldName, newName }));
        reply.redirect(app.reverse('labels'));

        return reply;
      } catch ({ data }) {
        request.flash('error', request.t('flash.labels.edit.error', { name: label.name }));
        const values = { id: request.params.id, name: request.body.name };
        reply.code(422).render('labels/edit', { values, errors: data });
        return reply;
      }
    })
    .delete('/labels/:id', { preValidation: app.authenticate }, async (request, reply) => {
      const label = await models.label.query().findById(request.params.id)
        .withGraphJoined('[tasks]');

      if (isEmpty(label.tasks)) {
        await label.$query().delete();
        request.flash('info', request.t('flash.labels.delete.success', { name: label.name }));
        reply.redirect(app.reverse('labels'));

        return reply;
      }

      const labels = await models.label.query();

      request.flash('error', request.t('flash.labels.delete.error'));
      reply.code(422).render('labels/index', { labels });

      return reply;
    });
};
