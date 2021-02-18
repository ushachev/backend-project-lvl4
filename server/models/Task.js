import BaseModel from './BaseModel.js';

export default class Task extends BaseModel {
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
        executorId: { type: ['integer', null] },
      },
    };
  }

  static get modifiers() {
    const { ref } = Task;
    return {
      defaultSelects(builder) {
        builder.select(
          ref('id'),
          ref('name'),
          'description',
          'statusId',
          'executorId',
          'creatorId',
          ref('createdAt'),
        );
      },
      indexSelects(builder) {
        builder.select(ref('id'), ref('name'), ref('createdAt'));
      },
      findByFilterQuery(builder, query, creatorId) {
        const mapper = {
          status: { 'status.id': query.status },
          executor: { 'executor.id': query.executor },
          isCreatorUser: { 'creator.id': creatorId },
          label: { 'labels.id': query.label },
        };
        const filter = Object.entries(query)
          .reduce((acc, [key, value]) => (value ? { ...acc, ...mapper[key] } : acc), {});

        builder.where(filter);
      },
    };
  }

  static get relationMappings() {
    return {
      status: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'Status',
        join: {
          from: 'tasks.statusId',
          to: 'statuses.id',
        },
      },
      creator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'User',
        join: {
          from: 'tasks.creatorId',
          to: 'users.id',
        },
      },
      executor: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'User',
        join: {
          from: 'tasks.executorId',
          to: 'users.id',
        },
      },
      labels: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: 'Label',
        join: {
          from: 'tasks.id',
          through: {
            from: 'tasks_labels.taskId',
            to: 'tasks_labels.labelId',
          },
          to: 'labels.id',
        },
      },
    };
  }
}
