import { S3_BUCKET, S3_REGION, S3_USE_REGION } from '../constants.js';

export const getS3Url = (s3Path) => {
  const s3ObjectUrl = `https://s3.${S3_USE_REGION ? `${S3_REGION}.` : ''}amazonaws.com/${S3_BUCKET}/${s3Path}`;

  return s3ObjectUrl;
}
