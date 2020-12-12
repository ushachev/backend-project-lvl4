/* eslint-disable no-underscore-dangle */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import objection from 'objection';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Model } = objection;

export default class BaseModel extends Model {
  static get modelPaths() {
    return [__dirname];
  }
}
