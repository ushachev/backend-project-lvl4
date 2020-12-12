const { Model } = require('objection');
const objectionUnique = require('objection-unique');

const unique = objectionUnique({ fields: ['name'] });

class TaskStatus extends unique(Model) {
  static get tableName() {
    return 'task_statuses';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
      },
    };
  }

  static get relationMappings() {
    const Task = require('./Task.js');

    return {
      task: {
        relation: Model.HasManyRelation,
        modelClass: Task,
        join: {
          from: 'task_statuses.id',
          to: 'tasks.statusId',
        },
      },
    };
  }
}

module.exports = TaskStatus;
