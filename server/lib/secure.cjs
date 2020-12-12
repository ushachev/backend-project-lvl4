// import crypto from 'crypto';

// export default (value) => crypto.createHash('sha256')
//   .update(value)
//   .digest('hex');
const crypto = require('crypto');

module.exports = (value) => crypto.createHash('sha256')
  .update(value)
  .digest('hex');
