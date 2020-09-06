export default async (app) => {
  app.get('/', { name: 'root' }, (request, reply) => {
    if (request.signedIn) {
      reply.render('pages/index');
    } else {
      reply.render('pages/welcome');
    }
  });
};
