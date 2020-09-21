import { resolve } from 'path';

const migrations = {
  directory: resolve('server', 'migrations'),
};

export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3',
    },
    migrations,
  },
  test: {
    client: 'sqlite3',
    connection: ':memory:',
    migrations,
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations,
  },
};
