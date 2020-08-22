export default async (app) => {
  app
    .get('/users/new', { name: 'newUser' }, async (_request, reply) => (
      reply.view('pages/newUser')
    ));
};
