/* eslint-disable no-underscore-dangle */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fastify from 'fastify';
import autoLoad from 'fastify-autoload';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mode = process.env.NODE_ENV || 'development';
const isProduction = mode === 'production';
const isDevelopment = mode === 'development';

const registerPlugins = (app) => {
  app
    .register(autoLoad, {
      dir: join(__dirname, 'plugins'),
    })
    .register(autoLoad, {
      dir: join(__dirname, 'routes'),
    });
};

export default () => {
  const logger = (isDevelopment || isProduction) && {
    prettyPrint: isDevelopment && {
      translateTime: 'SYS:standard',
    },
    base: null,
  };
  const app = fastify({ logger });

  registerPlugins(app);

  return app;
};
