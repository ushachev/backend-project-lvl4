import getValidator from '../lib/validators.js';
import { requireSignedIn, requireSignedOut } from '../lib/preHandlers.js';

export default async (app) => {
  app
    .get('/users', { name: 'users', preHandler: requireSignedIn }, async (request, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('/pages/users', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser', preHandler: requireSignedOut }, (request, reply) => {
      reply.render('pages/newUser');
    })
    .post('/users', { preHandler: requireSignedOut }, async (request, reply) => {
      try {
        const { repeatedPassword, ...userData } = request.body;
        const validateRepeatedPassword = getValidator('repeatedPassword');

        const user = await app.objection.models.user.fromJson(userData);
        validateRepeatedPassword(repeatedPassword === userData.password);
        await app.objection.models.user.query().insert(user);
        request.flash('info', `${user.email} успешно зарегистрирван`);
        reply.redirect(app.reverse('newSession'));

        return reply;
      } catch ({ data }) {
        reply.code(422).render('pages/newUser', { values: request.body, errors: data });
        return reply;
      }
    });
};
