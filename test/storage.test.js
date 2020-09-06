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
  t.same(instance.read(), [data], 'what is saved is read');

  const newData = { email: 'wsx@qaz.com', password: '321' };
  instance.update([newData]);
  t.same(instance.read(), [newData], 'what is updated is read');
});
