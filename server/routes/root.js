export default async (app) => {
  app.get('/', { name: 'root' }, async (request, reply) => {
    if (!request.signedIn) {
      return reply.render('pages/welcome');
    }
    const user = request.session.get('user');
    return reply.render('pages/index', { user });
  });
};
