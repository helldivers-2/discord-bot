import {createGzip, createGunzip} from 'zlib';
import {createReadStream, createWriteStream} from 'fs';
// eslint-disable-next-line node/no-unsupported-features/node-builtins
import {pipeline, Readable} from 'stream';
import {promisify} from 'util';

const gzip = promisify(pipeline);
const gunzip = promisify(pipeline);

export async function compressFile(inputFile: string, outputFile: string) {
  const source = createReadStream(inputFile);
  const destination = createWriteStream(outputFile);
  await gzip(source, createGzip(), destination);
}

export async function writeGzipJson(outputFile: string, jsonData: any) {
  const jsonString = JSON.stringify(jsonData);
  // eslint-disable-next-line node/no-unsupported-features/node-builtins
  const source = Readable.from(jsonString, {encoding: 'utf8'});
  const destination = createWriteStream(outputFile);
  await gzip(source, createGzip(), destination);
}

export async function readGzipJson(inputFile: string) {
  let data = '';
  const source = createReadStream(inputFile);
  await gunzip(
    source,
    createGunzip().on('data', chunk => (data += chunk))
  );
  return JSON.parse(data);
}
