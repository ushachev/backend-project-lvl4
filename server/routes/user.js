import encrypt from '../lib/secure.js';

export default async (app) => {
  app
    .get('/user', { name: 'userAccount' }, (request, reply) => {
      if (request.signedIn) {
        reply.render('pages/editUser');
      } else {
        request.flash('danger', 'доступ запрещён, пожалалуйста авторизуйтесь');
        reply.redirect(app.reverse('root'));
      }
    })
    .patch('/user/profile', { name: 'userProfile' }, async (request, reply) => {
      const { firstName, lastName } = request.body;
      const errors = {};

      if (!firstName) {
        errors.firstName = 'поле не должно быть пустым';
      }
      if (!lastName) {
        errors.lastName = 'поле не должно быть пустым';
      }

      if (Object.keys(errors).length > 0) {
        reply.code(422).render('pages/editUser', { values: request.body, errors });
        return reply;
      }

      const user = request.currentUser;

      user.firstName = firstName;
      user.lastName = lastName;
      request.flash('info', `аккаунт ${user.email} изменён`);

      reply.redirect(app.reverse('userAccount'));
      return reply;
    })
    .patch('/user/password', { name: 'userPassword' }, async (request, reply) => {
      const { password, newPassword, repeatedNewPassword } = request.body;
      const errors = {};
      const user = request.currentUser;

      if (!password || user.passwordDigest !== encrypt(password)) {
        errors.password = 'неверный пароль';
      }
      if (!errors.password && !newPassword) {
        errors.newPassword = 'должно быть не меньше 3 символов';
      }
      if (!errors.password && newPassword && repeatedNewPassword !== newPassword) {
        errors.repeatedNewPassword = 'должно совпадать с новым паролем';
      }

      if (Object.keys(errors).length > 0) {
        reply.code(422).render('pages/editUser', { activePasswordBlock: true, errors });
        return reply;
      }

      user.passwordDigest = encrypt(newPassword);
      request.flash('info', `аккаунт ${user.email} изменён`);

      reply.redirect(app.reverse('userAccount'));
      return reply;
    })
    .delete('/user', async (request, reply) => {
      request.session.set('userId', null);
      const users = app.read();
      app.update(users.filter((u) => u.id !== request.currentUser.id));
      request.flash('info', `аккаунт ${request.currentUser.email} удалён`);

      reply.redirect(app.reverse('root'));
      return reply;
    });
};
