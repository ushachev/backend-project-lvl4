import User from '../models/User.js';

export default async (app) => {
  app
    .get('/users', { name: 'users' }, async () => app.read())
    .get('/users/new', { name: 'newUser' }, (request, reply) => {
      if (request.signedIn) {
        reply.redirect(app.reverse('root'));
      } else {
        reply.render('pages/newUser', { activeNavItem: 'newUser' });
      }
    })
    .post('/users', async (request, reply) => {
      const userForm = request.body;
      const errors = {};

      if (!userForm.firstName) {
        errors.firstName = 'поле не должно быть пустым';
      }
      if (!userForm.lastName) {
        errors.lastName = 'поле не должно быть пустым';
      }
      if (!userForm.email) {
        errors.email = 'неправильный email';
      }
      if (!userForm.password) {
        errors.password = 'должно быть не меньше 3 символов';
      }
      if (userForm.password && userForm.repeatedPassword !== userForm.password) {
        errors.repeatedPassword = 'должно совпадать с паролем';
      }

      if (Object.keys(errors).length > 0) {
        reply.code(422)
          .render('pages/newUser', { activeNavItem: 'newUser', values: request.body, errors });
        return reply;
      }

      const user = new User(userForm);
      app.save(user);
      request.flash('info', `${userForm.email} успешно зарегистрирван`);
      reply.redirect(app.reverse('newSession'));
      return reply;
    });
};
