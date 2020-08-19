#!/usr/bin/env node

import getApp from '../index.js';

const app = getApp();

const port = process.env.PORT || process.env.DEV_SERVER_PORT;
const address = '0.0.0.0';

const start = async () => {
  try {
    await app.listen(port, address);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
