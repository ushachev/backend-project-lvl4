import Rollbar from 'rollbar';
import fp from 'fastify-plugin';

const rollbar = new Rollbar({
  accessToken: process.env.POST_SERVER_ITEM_ROLLBAR_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

export default fp(async (app) => {
  app.addHook('onError', async (request, _reply, error) => {
    if (process.env.NODE_ENV === 'production') {
      app.log.error(`Error reporting to rollbar, ignoring: ${error.message}`);
      rollbar.error(error, request);
    }
  });
});
