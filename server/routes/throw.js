export default async (app) => {
  app.get('/throw', async () => { throw new Error('Throw test'); });
};
