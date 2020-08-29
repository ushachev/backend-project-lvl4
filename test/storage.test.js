import tap from 'tap';
import fastify from 'fastify';
import storagePlugin from '../server/plugins/storage.js';

tap.test('test storage decorator:', async (t) => {
  const instance = fastify();
  instance.register(storagePlugin);
  const data = { email: 'qaz@wsx.com', password: '123' };

  t.tearDown(() => instance.close());

  await instance.ready();
  instance.save(data);
  const actual = instance.read();
  t.same(actual, [data], 'what is saved is read');
});
