export default async (app) => {
  app.get('/', { name: 'root' }, (request, reply) => {
    if (request.signedIn) {
      reply.render('application/index');
    } else {
      reply.render('welcome/index');
    }
  });
};
