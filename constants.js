import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}.local` });
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
dotenv.config({ path: '.env.local' });
dotenv.config();

import S3 from 'aws-sdk/clients/s3.js';

export const PROXY_HOST = process.env.PROXY_HOST;
export const PROXY_PORT = process.env.PROXY_PORT;
export const S3_BUCKET = process.env.S3_BUCKET;
export const S3_KEY = process.env.S3_KEY;
export const S3_SECRET = process.env.S3_SECRET;
export const S3_REGION = process.env.S3_REGION;
export const S3_USE_REGION = !!JSON.parse(process.env.S3_USE_REGION);
export const S3_CREDENTIALS = {
  signatureVersion: 'v4',
  accessKeyId: S3_KEY,
  secretAccessKey: S3_SECRET,
};
