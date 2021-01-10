export const up = (knex) => knex.schema
  .table('tasks', (table) => {
    table.dropForeign('status_id');
  })
  .renameTable('task_statuses', 'statuses')
  .table('tasks', (table) => {
    table.foreign('status_id').references('id').inTable('statuses');
  });

export const down = (knex) => knex.schema
  .table('tasks', (table) => {
    table.dropForeign('status_id');
  })
  .renameTable('statuses', 'task_statuses')
  .table('tasks', (table) => {
    table.foreign('status_id').references('id').inTable('task_statuses');
  });
