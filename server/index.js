/* eslint-disable no-underscore-dangle */

import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import fs from 'fs';
import fastify from 'fastify';
import autoLoad from 'fastify-autoload';
import pointOfView from 'point-of-view';
import pug from 'pug';
import fastifyStatic from 'fastify-static';
import fastifyReverseRoutes from 'fastify-reverse-routes';
import fastifyFormbody from 'fastify-formbody';
import fastifySecureSession from 'fastify-secure-session';
import fastifyFlash from 'fastify-flash';
import fastifyMethodOverride from 'fastify-method-override';
import fastifyObjectionjs from 'fastify-objectionjs';

import knexConfig from '../knexfile.js';
import models from './models/index.js';
import getHelpers from './helpers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mode = process.env.NODE_ENV || 'development';
const isDevelopment = mode === 'development';
const isTest = mode === 'test';

const registerPlugins = (app) => {
  app
    .register(fastifyReverseRoutes.plugin)
    .register(fastifyFormbody)
    .register(fastifySecureSession, {
      key: fs.readFileSync(join(__dirname, '..', 'secret-key')),
      cookie: {
        path: '/',
      },
    })
    .register(fastifyFlash)
    .register(fastifyMethodOverride)
    .register(fastifyObjectionjs, {
      knexConfig: knexConfig[mode],
      models,
    })
    .register(autoLoad, {
      dir: join(__dirname, 'plugins'),
    })
    .register(autoLoad, {
      dir: join(__dirname, 'routes'),
    });
};

const setUpViews = (app) => {
  const helpers = getHelpers(app);

  app.register(pointOfView, {
    engine: { pug },
    includeViewExtension: true,
    root: join(__dirname, 'views'),
    defaultContext: { ...helpers },
  });

  app.decorateReply('render', function render(viewPath, locals) {
    this.view(viewPath, { ...locals, reply: this, activeNavItem: basename(viewPath) });
  });
};

const setUpStaticAssets = (app) => {
  app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/assets/',
  });
};

const addHooks = (app) => {
  app.decorateRequest('currentUser', null);
  app.decorateRequest('signedIn', false);

  app.addHook('preHandler', async (request) => {
    const userId = request.session.get('userId');
    if (userId) {
      request.currentUser = await app.objection.models.user.query().findById(userId);
      request.signedIn = true;
    }
  });
  app.addHook('onReady', async function migrate() {
    if (isTest) {
      await this.objection.knex.migrate.latest();
    }
  });
};

export default () => {
  const logger = !isTest && {
    prettyPrint: isDevelopment,
    base: null,
  };
  const app = fastify({ logger });

  registerPlugins(app);
  setUpViews(app);
  setUpStaticAssets(app);
  addHooks(app);

  return app;
};
