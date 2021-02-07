import requireSignedOut from '../lib/preHandlers.js';

export default async (app) => {
  app
    .get('/session/new', { name: 'newSession', preHandler: requireSignedOut }, (_req, reply) => {
      reply.render('session/new');
    })
    .post(
      '/session',
      { name: 'session', preHandler: requireSignedOut },
      app.fp.authenticate('form', async (request, reply, err, user) => {
        if (err) {
          throw err;
        }
        if (!user) {
          const { email } = request.body;

          request.flash('error', request.t('flash.session.create.error'));
          reply.code(422).render('session/new', { values: { email } });

          return reply;
        }
        await request.logIn(user);
        request.flash('info', request.t('flash.session.create.success'));
        reply.redirect(app.reverse('root'));

        return reply;
      }),
    )
    .delete('/session', (request, reply) => {
      request.logOut();
      request.flash('info', request.t('flash.session.delete.success'));
      reply.redirect(app.reverse('root'));
    });
};
