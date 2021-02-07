import getValidator from '../lib/validators.js';
import requireSignedOut from '../lib/preHandlers.js';

export default async (app) => {
  app
    .get('/users', { name: 'users', preValidation: app.authenticate }, async (request, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser', preHandler: requireSignedOut }, (request, reply) => {
      reply.render('users/new');
    })
    .post('/users', { preHandler: requireSignedOut }, async (request, reply) => {
      try {
        const { repeatedPassword, ...userData } = request.body;
        const validateRepeatedPassword = getValidator('repeatedPassword');

        const user = await app.objection.models.user.fromJson(userData);
        validateRepeatedPassword(repeatedPassword === userData.password);
        await app.objection.models.user.query().insert(user);
        request.flash('info', request.t('flash.users.create.success', { account: user.email }));
        reply.redirect(app.reverse('newSession'));

        return reply;
      } catch ({ data }) {
        request.flash('error', request.t('flash.users.create.error'));
        reply.code(422).render('users/new', { values: request.body, errors: data });
        return reply;
      }
    });
};
