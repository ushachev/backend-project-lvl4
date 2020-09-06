export default async (app) => {
  app
    .get('/session/new', { name: 'newSession' }, (request, reply) => {
      if (request.signedIn) {
        reply.redirect(app.reverse('root'));
      } else {
        reply.render('pages/newSession', { activeNavItem: 'newSession' });
      }
    })
    .post('/session', { name: 'session' }, async (request, reply) => {
      const { email, password } = request.body;
      const users = app.read();
      const user = email && users.find((u) => u.email === email);

      if (!user || user.password !== password) {
        request.flash('danger', 'неправильный email или пароль');
        reply.code(422)
          .render('pages/newSession', { activeNavItem: 'newSession', values: { email } });
        return reply;
      }

      request.flash('info', 'вы вошли в сервис');
      request.session.set('userId', user.id);
      reply.redirect(app.reverse('root'));
      return reply;
    })
    .delete('/session', (request, reply) => {
      request.session.set('userId', null);
      request.flash('info', 'вы вышли из сервиса');
      reply.redirect(app.reverse('root'));
    });
};
