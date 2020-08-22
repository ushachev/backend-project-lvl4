export default async (app) => {
  app.get('/', { name: 'root' }, async (_request, reply) => reply.view('pages/welcome'));
};
