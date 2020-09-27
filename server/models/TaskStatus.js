import objection from 'objection';
import objectionUnique from 'objection-unique';

const { Model } = objection;
const unique = objectionUnique({ fields: ['name'] });

export default class TaskStatus extends unique(Model) {
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
}
