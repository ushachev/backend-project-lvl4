/* eslint-disable import/prefer-default-export */

import { omit } from 'lodash';
import testData from '../../__fixtures__/testData.js';
import encrypt from '../../server/lib/secure.js';

const {
  users, statuses, tasks, labels, tasksLabels,
} = testData;

export const seed = async (knex) => {
  await knex('users').truncate().insert(users.map((user) => ({
    ...omit(user, 'password'),
    passwordDigest: encrypt(user.password),
  })));
  await knex('statuses').truncate().insert(statuses);
  await knex('labels').truncate().insert(labels);
  await knex('tasks').truncate().insert(tasks);

  return knex('tasks_labels').truncate().insert(tasksLabels);
};
