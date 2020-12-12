// import BaseModel from './BaseModel.js';

// export default class Task extends BaseModel {
//   static get tableName() {
//     return 'tasks';
//   }

//   static get jsonSchema() {
//     return {
//       type: 'object',
//       required: ['name', 'statusId', 'creatorId'],
//       properties: {
//         id: { type: 'integer' },
//         name: { type: 'string', minLength: 1 },
//         description: { type: 'string' },
//         statusId: { type: 'integer', minimum: 1 },
//         creatorId: { type: 'integer', minimum: 1 },
//         executorId: { type: 'integer' },
//       },
//     };
//   }

//   static get relationMappings() {
//     return {
//       status: {
//         relation: BaseModel.BelongsToOneRelation,
//         modelClass: 'TaskStatus',
//         join: {
//           from: 'tasks.statusId',
//           to: 'task_statuses.id',
//         },
//       },
//       creator: {
//         relation: BaseModel.BelongsToOneRelation,
//         modelClass: 'User',
//         join: {
//           from: 'tasks.creatorId',
//           to: 'users.id',
//         },
//       },
//       executor: {
//         relation: BaseModel.BelongsToOneRelation,
//         modelClass: 'User',
//         join: {
//           from: 'tasks.executorId',
//           to: 'users.id',
//         },
//       },
//     };
//   }
// }
const { Model } = require('objection');

class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'statusId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        statusId: { type: 'integer', minimum: 1 },
        creatorId: { type: 'integer', minimum: 1 },
        executorId: { type: ['integer', 'null'] },
      },
    };
  }

  static get relationMappings() {
    const TaskStatus = require('./TaskStatus.js');
    const User = require('./User.js');

    return {
      status: {
        relation: Model.BelongsToOneRelation,
        modelClass: TaskStatus,
        join: {
          from: 'tasks.statusId',
          to: 'task_statuses.id',
        },
      },
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.creatorId',
          to: 'users.id',
        },
      },
      executor: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.executorId',
          to: 'users.id',
        },
        default: '',
      },
    };
  }
}

module.exports = Task;
