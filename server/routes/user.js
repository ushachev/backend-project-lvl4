import getValidator from '../lib/validators.js';
import encrypt from '../lib/secure.js';

export default async (app) => {
  app
    .get('/user', { name: 'userAccount', preValidation: app.authenticate }, (_req, reply) => {
      reply.render('users/edit');
    })
    .patch(
      '/user/profile',
      { name: 'userProfile', preValidation: app.authenticate },
      async (request, reply) => {
        const { user } = request;
        try {
          const { firstName, lastName } = request.body;

          await user.$query().patch({ firstName, lastName });
          request.flash('info', request.t('flash.users.edit.success', { account: user.email }));
          reply.redirect(app.reverse('userAccount'));

          return reply;
        } catch ({ data }) {
          request.flash('error', request.t('flash.users.edit.error', { account: user.email }));
          reply.code(422).render('users/edit', { values: request.body, errors: data });

          return reply;
        }
      },
    )
    .patch(
      '/user/password',
      { name: 'userPassword', preValidation: app.authenticate },
      async (request, reply) => {
        const { user } = request;
        try {
          const { currentPassword, password, repeatedPassword } = request.body;
          const validatePassword = getValidator('password');
          const validateRepeatedPassword = getValidator('repeatedPassword');

          validatePassword(currentPassword && user.passwordDigest === encrypt(currentPassword));
          validateRepeatedPassword(repeatedPassword === password);
          await user.$query().patch({ password });
          request.flash('info', request.t('flash.users.edit.success', { account: user.email }));
          reply.redirect(app.reverse('userAccount'));

          return reply;
        } catch ({ data }) {
          request.flash('error', request.t('flash.users.edit.error', { account: user.email }));
          reply.code(422).render('users/edit', { activePasswordBlock: true, errors: data });

          return reply;
        }
      },
    )
    .delete('/user', { preValidation: app.authenticate }, async (request, reply) => {
      const { user } = request;
      try {
        await user.$query().delete();
        request.session.set('userId', null);
        request.flash('info', request.t('flash.users.delete.success', { account: user.email }));
        reply.redirect(app.reverse('root'));

        return reply;
      } catch (error) {
        if (error.name !== 'ForeignKeyViolationError') {
          throw error;
        }

        request.flash('error', request.t('flash.users.delete.error'));
        reply.code(422).render('users/edit');

        return reply;
      }
    });
};
