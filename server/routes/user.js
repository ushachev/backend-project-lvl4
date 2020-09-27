import { requireSignedIn } from '../lib/preHandlers.js';
import getValidator from '../lib/validators.js';
import encrypt from '../lib/secure.js';

export default async (app) => {
  app
    .get('/user', { name: 'userAccount', preHandler: requireSignedIn }, (_req, reply) => {
      reply.render('pages/editUser');
    })
    .patch(
      '/user/profile',
      { name: 'userProfile', preHandler: requireSignedIn },
      async (request, reply) => {
        try {
          const { firstName, lastName } = request.body;

          await request.currentUser.$query().patch({ firstName, lastName });
          request.flash('info', `аккаунт ${request.currentUser.email} изменён`);
          reply.redirect(app.reverse('userAccount'));

          return reply;
        } catch ({ data }) {
          request.flash('danger', `не получилось изменить аккаунт ${request.currentUser.email}`);
          reply.code(422).render('pages/editUser', { values: request.body, errors: data });

          return reply;
        }
      },
    )
    .patch(
      '/user/password',
      { name: 'userPassword', preHandler: requireSignedIn },
      async (request, reply) => {
        try {
          const { currentPassword, password, repeatedPassword } = request.body;
          const validatePassword = getValidator('password');
          const validateRepeatedPassword = getValidator('repeatedPassword');
          const user = request.currentUser;

          validatePassword(currentPassword && user.passwordDigest === encrypt(currentPassword));
          validateRepeatedPassword(repeatedPassword === password);
          await user.$query().patch({ password });
          request.flash('info', `аккаунт ${user.email} изменён`);
          reply.redirect(app.reverse('userAccount'));

          return reply;
        } catch ({ data }) {
          request.flash('danger', `не получилось изменить аккаунт ${request.currentUser.email}`);
          reply.code(422).render('pages/editUser', { activePasswordBlock: true, errors: data });

          return reply;
        }
      },
    )
    .delete('/user', { preHandler: requireSignedIn }, async (request, reply) => {
      await request.currentUser.$query().delete();
      request.session.set('userId', null);
      request.flash('info', `аккаунт ${request.currentUser.email} удалён`);
      reply.redirect(app.reverse('root'));

      return reply;
    });
};
