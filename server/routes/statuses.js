import { requireSignedIn } from '../lib/preHandlers.js';

export default async (app) => {
  app
    .get('/statuses', { name: 'statuses', preHandler: requireSignedIn }, async (request, reply) => {
      const statuses = await app.objection.models.status.query();
      reply.render('statuses/index', { statuses });
      return reply;
    })
    .get('/statuses/:id/edit', { preHandler: requireSignedIn }, async (request, reply) => {
      const status = await app.objection.models.status.query().findById(request.params.id);
      reply.render('statuses/edit', { values: status });
      return reply;
    })
    .post('/statuses', { preHandler: requireSignedIn }, async (request, reply) => {
      try {
        const status = await app.objection.models.status.fromJson(request.body);
        await app.objection.models.status.query().insert(status);
        request.flash('info', request.t('flash.statuses.create.success', { ...request.body }));
        reply.redirect(app.reverse('statuses'));

        return reply;
      } catch ({ data }) {
        const statuses = await app.objection.models.status.query();
        reply.code(422).render('statuses/index', { statuses, values: request.body, errors: data });
        return reply;
      }
    })
    .patch('/statuses/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const status = await app.objection.models.status.query().findById(request.params.id);

      try {
        const newName = request.body.name;
        const oldName = status.name;

        await status.$query().patch({ name: newName });
        request.flash('info', request.t('flash.statuses.edit.success', { oldName, newName }));
        reply.redirect(app.reverse('statuses'));

        return reply;
      } catch ({ data }) {
        request.flash('danger', request.t('flash.statuses.edit.error', { name: status.name }));
        const values = { id: request.params.id, name: request.body.name };
        reply.code(422).render('statuses/edit', { values, errors: data });
        return reply;
      }
    })
    .delete('/statuses/:id', { preHandler: requireSignedIn }, async (request, reply) => {
      const status = await app.objection.models.status.query().findById(request.params.id);
      await status.$query().delete();
      request.flash('info', request.t('flash.statuses.delete.success', { name: status.name }));
      reply.redirect(app.reverse('statuses'));

      return reply;
    });
};
