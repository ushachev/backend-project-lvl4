import { requireSignedOut } from '../lib/preHandlers.js';
import encrypt from '../lib/secure.js';

export default async (app) => {
  app
    .get('/session/new', { name: 'newSession', preHandler: requireSignedOut }, (_req, reply) => {
      reply.render('session/new');
    })
    .post('/session', { name: 'session', preHandler: requireSignedOut }, async (request, reply) => {
      const { email, password } = request.body;
      const user = email && await app.objection.models.user.query().findOne({ email });

      if (!user || user.passwordDigest !== encrypt(password)) {
        request.flash('danger', request.t('flash.session.create.error'));
        reply.code(422).render('session/new', { values: { email } });
        return reply;
      }

      request.flash('info', request.t('flash.session.create.success'));
      request.session.set('userId', user.id);
      reply.redirect(app.reverse('root'));

      return reply;
    })
    .delete('/session', (request, reply) => {
      request.session.set('userId', null);
      request.flash('info', request.t('flash.session.delete.success'));
      reply.redirect(app.reverse('root'));
    });
};
