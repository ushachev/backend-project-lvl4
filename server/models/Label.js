import objectionUnique from 'objection-unique';
import BaseModel from './BaseModel.js';

const unique = objectionUnique({ fields: ['name'] });

export default class Label extends unique(BaseModel) {
  static get tableName() {
    return 'labels';
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
        relation: BaseModel.ManyToManyRelation,
        modelClass: 'Task',
        join: {
          from: 'labels.id',
          through: {
            from: 'tasks_labels.labelId',
            to: 'tasks_labels.taskId',
          },
          to: 'tasks.id',
        },
      },
    };
  }
}
