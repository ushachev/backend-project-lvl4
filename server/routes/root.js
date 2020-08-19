export default async (app) => {
  app.get('/', async (_request, reply) => reply.view('welcome/index'));
};
