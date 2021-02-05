import objection from 'objection';

const { Model } = objection;

export default class BaseModel extends Model {
  static get modelPaths() {
    return [__dirname];
  }
}
