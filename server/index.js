/* eslint-disable no-underscore-dangle */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fastify from 'fastify';
import autoLoad from 'fastify-autoload';
import pointOfView from 'point-of-view';
import pug from 'pug';
import fastifyStatic from 'fastify-static';
import fastifyReverseRoutes from 'fastify-reverse-routes';
import fastifyFormbody from 'fastify-formbody';
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
    defaultContext: {
      ...helpers,
      assetPath: (filename) => `/assets/${filename}`,
    },
  });
};

const setUpStaticAssets = (app) => {
  app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/assets/',
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

  return app;
};
