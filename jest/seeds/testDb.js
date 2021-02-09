/* eslint-disable import/prefer-default-export */

import testData from '../helpers/testData.js';
import encrypt from '../../server/lib/secure.js';

const {
  users, statuses, tasks: [task1, task2], labels,
} = testData;

export const seed = async (knex) => {
  await knex('users').truncate().insert(users.map(({
    firstName, lastName, email, password,
  }) => ({
    firstName,
    lastName,
    email,
    passwordDigest: encrypt(password),
  })));
  await knex('statuses').truncate().insert(statuses);
  await knex('labels').truncate().insert(labels);
  await knex('tasks').truncate().insert([
    {
      name: task1.name,
      status_id: 2,
      creator_id: 2,
      executor_id: 3,
    },
    {
      name: task2.name,
      status_id: 3,
      creator_id: 3,
      executor_id: 2,
    },
  ]);

  return knex('tasks_labels').truncate().insert([
    {
      task_id: 1,
      label_id: 2,
    },
    {
      task_id: 1,
      label_id: 3,
    },
    {
      task_id: 2,
      label_id: 3,
    },
    {
      task_id: 2,
      label_id: 4,
    },
  ]);
};
