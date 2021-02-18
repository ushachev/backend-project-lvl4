import objectionUnique from 'objection-unique';
import BaseModel from './BaseModel.js';

const unique = objectionUnique({ fields: ['name'] });

export default class Status extends unique(BaseModel) {
  static get tableName() {
    return 'statuses';
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

  static get modifiers() {
    return {
      defaultSelects(builder) {
        builder.select('id', 'name');
      },
    };
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: BaseModel.HasManyRelation,
        modelClass: 'Task',
        join: {
          from: 'statuses.id',
          to: 'tasks.statusId',
        },
      },
    };
  }
}
