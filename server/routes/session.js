import { requiredSignedOut } from '../lib/preHandlers.js';
import encrypt from '../lib/secure.js';

export default async (app) => {
  app
    .get('/session/new', { name: 'newSession', preHandler: requiredSignedOut }, (_req, reply) => {
      reply.render('pages/newSession');
    })
    .post('/session', { name: 'session' }, async (request, reply) => {
      const { email, password } = request.body;
      const user = email && await app.objection.models.user.query().findOne({ email });

      if (!user || user.passwordDigest !== encrypt(password)) {
        request.flash('danger', 'неправильный email или пароль');
        reply.code(422).render('pages/newSession', { values: { email } });
        return reply;
      }

      request.flash('info', 'вы вошли в сервис');
      request.session.set('userId', user.id);
      reply.redirect(app.reverse('root'));
      return reply;
    })
    .delete('/session', (request, reply) => {
      request.session.set('userId', null);
      request.flash('info', 'вы вышли из аккаунта');
      reply.redirect(app.reverse('root'));
    });
};
