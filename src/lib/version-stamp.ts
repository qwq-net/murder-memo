// version.ts に現在時刻を YYYYMMDDHHmm 形式で刻印するスクリプト
import { readFileSync, writeFileSync } from 'node:fs';

const filePath = new URL('./version.ts', import.meta.url);
const now = new Date();
const version =
  String(now.getFullYear()) +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0');

const content = readFileSync(filePath, 'utf8');
writeFileSync(filePath, content.replace(/APP_VERSION = '[^']*'/, `APP_VERSION = '${version}'`));
console.log('APP_VERSION →', version);
