import fs from 'fs';
import { join } from 'path';

const secretPath = join(__dirname, 'secret-key');
const envPath = join(__dirname, '.env');

const keyBuffer = fs.readFileSync(secretPath);
const hexString = keyBuffer.toString('hex');

try {
  fs.appendFileSync(envPath, `\nCOOKIE_KEY = ${hexString}`);
  fs.rmSync(secretPath);
  console.log(`The COOKIE_KEY was appended to ${envPath}`);
} catch (err) {
  console.error('Error while appending COOKIE_KEY:', err);
  process.exit(1);
}
