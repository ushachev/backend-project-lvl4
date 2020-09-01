export default async (app) => {
  app
    .get('/session/new', { name: 'newSession' }, async (request, reply) => (request.signedIn
      ? reply.redirect(app.reverse('root'))
      : reply.render('pages/newSession', { activeNavItem: 'newSession' })
    ))
    .post('/session', { name: 'session' }, async (request, reply) => {
      const { email, password } = request.body;
      const users = app.read();
      const user = email && users.find((u) => u.email === email);

      if (!user || user.password !== password) {
        request.flash('danger', 'неправильный email или пароль');
        return reply.code(422)
          .render('pages/newSession', { activeNavItem: 'newSession', values: { email } });
      }

      request.flash('info', 'вы вошли в сервис');
      request.session.set('user', user.email);
      return reply.redirect(app.reverse('root'));
    })
    .delete('/session', async (request, reply) => {
      request.session.set('user', null);
      request.flash('info', 'вы вышли из сервиса');
      return reply.redirect(app.reverse('root'));
    });
};
