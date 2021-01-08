import { requireSignedIn } from '../lib/preHandlers.js';

export default async (app) => {
  app
    .get('/labels', { name: 'labels', preHandler: requireSignedIn }, async (request, reply) => {
      const labels = await app.objection.models.label.query();
      reply.render('labels/index', { labels });
      return reply;
    })
    .get('/labels/:id/edit', { preHandler: requireSignedIn }, async (request, reply) => {
      const label = await app.objection.models.label.query().findById(request.params.id);
      reply.render('labels/edit', { values: label });
      return reply;
    })
    .post('/labels', { preHandler: requireSignedIn }, async (request, reply) => {
      try {
        const label = await app.objection.models.label.fromJson(request.body);
        await app.objection.models.label.query().insert(label);
        request.flash('info', request.t('flash.labels.create.success', { ...request.body }));
        reply.redirect(app.reverse('labels'));

        return reply;
      } catch ({ data }) {
        const labels = await app.objection.models.label.query();
        reply.code(422).render('labels/index', { labels, values: request.body, errors: data });
        return reply;
      }
    })
    .patch('/labels/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const label = await app.objection.models.label.query().findById(request.params.id);

      try {
        const newName = request.body.name;
        const oldName = label.name;

        await label.$query().patch({ name: newName });
        request.flash('info', request.t('flash.labels.edit.success', { oldName, newName }));
        reply.redirect(app.reverse('labels'));

        return reply;
      } catch ({ data }) {
        request.flash('danger', request.t('flash.labels.edit.error', { name: label.name }));
        const values = { id: request.params.id, name: request.body.name };
        reply.code(422).render('labels/edit', { values, errors: data });
        return reply;
      }
    })
    .delete('/labels/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const label = await app.objection.models.label.query().findById(request.params.id);
      await label.$query().delete();
      request.flash('info', request.t('flash.labels.delete.success', { name: label.name }));
      reply.redirect(app.reverse('labels'));

      return reply;
    });
};
