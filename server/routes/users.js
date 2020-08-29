export default async (app) => {
  app
    .get('/users', { name: 'users' }, async () => app.read())
    .get('/users/new', { name: 'newUser' }, async (_request, reply) => (
      reply.view('pages/newUser', { activeNavItem: 'newUser' })
    ))
    .post('/users', async (request, reply) => {
      const { email, password, repeatedPassword } = request.body;
      const errors = {};

      if (!email) {
        errors.email = 'неправильный email';
      }
      if (!password) {
        errors.password = 'должно быть не меньше 3 символов';
      }
      if (password && repeatedPassword !== password) {
        errors.repeatedPassword = 'должно совпадать с паролем';
      }

      if (Object.keys(errors).length > 0) {
        return reply.code(422)
          .view('pages/newUser', { activeNavItem: 'newUser', values: request.body, errors });
      }
      app.save({ email, password, repeatedPassword });
      return reply.redirect(app.reverse('root'));
    });
};
