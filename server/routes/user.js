import { requireSignedIn } from '../lib/preHandlers.js';
import getValidator from '../lib/validators.js';
import encrypt from '../lib/secure.cjs';

export default async (app) => {
  app
    .get('/user', { name: 'userAccount', preHandler: requireSignedIn }, (_req, reply) => {
      reply.render('users/edit');
    })
    .patch(
      '/user/profile',
      { name: 'userProfile', preHandler: requireSignedIn },
      async (request, reply) => {
        try {
          const { firstName, lastName } = request.body;

          await request.currentUser.$query().patch({ firstName, lastName });
          request.flash('info', request.t('flash.users.edit.success', { account: request.currentUser.email }));
          reply.redirect(app.reverse('userAccount'));

          return reply;
        } catch ({ data }) {
          request.flash('danger', request.t('flash.users.edit.error', { account: request.currentUser.email }));
          reply.code(422).render('users/edit', { values: request.body, errors: data });

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
          request.flash('info', request.t('flash.users.edit.success', { account: user.email }));
          reply.redirect(app.reverse('userAccount'));

          return reply;
        } catch ({ data }) {
          request.flash('danger', request.t('flash.users.edit.error', { account: request.currentUser.email }));
          reply.code(422).render('users/edit', { activePasswordBlock: true, errors: data });

          return reply;
        }
      },
    )
    .delete('/user', { preHandler: requireSignedIn }, async (request, reply) => {
      await request.currentUser.$query().delete();
      request.session.set('userId', null);
      request.flash('info', request.t('flash.users.delete.success', { account: request.currentUser.email }));
      reply.redirect(app.reverse('root'));

      return reply;
    });
};
