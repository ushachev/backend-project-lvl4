#!/usr/bin/env node

import getApp from '../index.js';

const app = getApp();

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await app.listen(port);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
