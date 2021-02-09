import { join } from 'path';
import fs from 'fs';
import fastify from 'fastify';
import autoLoad from 'fastify-autoload';
import fastifyPassport from 'fastify-passport';
import fastifyErrorPage from 'fastify-error-page';
import pointOfView from 'point-of-view';
import pug from 'pug';
import fastifyStatic from 'fastify-static';
import fastifyReverseRoutes from 'fastify-reverse-routes';
import fastifyFormbody from 'fastify-formbody';
import fastifySecureSession from 'fastify-secure-session';
import fastifyMethodOverride from 'fastify-method-override';
import fastifyObjectionjs from 'fastify-objectionjs';
import i18next from 'i18next';
import i18nextMiddleware from 'i18next-http-middleware';
import ru from './locales/ru.js';
import webpackConfig from '../webpack.config.babel.js';

import knexConfig from '../knexfile.js';
import models from './models/index.js';
import getHelpers from './helpers/index.js';
import FormStrategy from './lib/passportStrategies/FormStrategy.js';

const mode = process.env.NODE_ENV || 'development';
const isDevelopment = mode === 'development';
const isTest = mode === 'test';

const setupLocalization = () => {
  i18next.init({
    lng: 'ru',
    fallbackLng: false,
    // debug: isDevelopment,
    resources: {
      ru,
    },
  });
};

const registerPlugins = (app) => {
  if (isDevelopment) {
    app.register(fastifyErrorPage);
  }
  fastifyPassport.registerUserDeserializer((user) => app.objection.models.user.query()
    .findById(user.id));
  fastifyPassport.registerUserSerializer((user) => Promise.resolve(user));
  fastifyPassport.use(new FormStrategy('form', app));
  app.decorate('fp', fastifyPassport);
  app.decorate('authenticate', (...args) => fastifyPassport.authenticate(
    'form',
    {
      failureRedirect: app.reverse('root'),
      failureFlash: i18next.t('flash.authError'),
    },
  )(...args));

  app
    .register(i18nextMiddleware.plugin, { i18next })
    .register(fastifyReverseRoutes.plugin)
    .register(fastifyFormbody)
    .register(fastifySecureSession, {
      key: fs.readFileSync(join(__dirname, '..', 'secret-key')),
      cookie: {
        path: '/',
      },
    })
    .register(fastifyPassport.initialize())
    .register(fastifyPassport.secureSession())
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
  const { devServer } = webpackConfig;
  const helpers = getHelpers(app);
  const devHost = `http://${devServer.host}:${devServer.port}`;
  const domain = isDevelopment ? devHost : '';

  app.register(pointOfView, {
    engine: { pug },
    includeViewExtension: true,
    root: join(__dirname, 'views'),
    defaultContext: {
      ...helpers,
      getAssetPath: (filename) => `${domain}/assets/${filename}`,
    },
  });

  app.decorateReply('render', function render(viewPath, locals) {
    this.view(viewPath, { ...locals, reply: this });
  });
};

const setUpStaticAssets = (app) => {
  app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/assets/',
  });
};

export default () => {
  const logger = {
    prettyPrint: isDevelopment,
    base: null,
  };
  const app = fastify({ logger });

  setupLocalization();

  registerPlugins(app);
  setUpViews(app);
  setUpStaticAssets(app);

  return app;
};
