import S3 from 'aws-sdk/clients/s3.js';
import Logger from './utils/Logger.js';
import { getS3Url } from './utils/s3.js';
import { S3_BUCKET, S3_CREDENTIALS } from './constants.js';
import Client from './models/Client.js';
import Request from './models/Request.js';
import Response from './models/Response.js';

class Server {
  #callback;
  #s3;

  constructor() {
    this.#s3 = new S3(S3_CREDENTIALS);
  }

  async listen(callback) {
    this.#callback = callback

    const listObjectsV2Params = {
      Bucket: S3_BUCKET,
      Prefix: 'requests/',
      StartAfter: 'requests/',
    };

    let objectsInProcessing = [];

    while(true) {
      try {
        const startTime = new Date();
        const { Contents: objects } = await this.#s3.listObjectsV2(listObjectsV2Params).promise();

        const objectsToProcess = objects.filter((o) => !objectsInProcessing.includes(JSON.stringify(o)));
        objectsInProcessing = objects.map((o) => JSON.stringify(o));

        objectsToProcess.forEach((object) => {
          (async () => {
            const logger = new Logger();
            await this.#processRequest(object, logger, startTime);

            setTimeout(async () => {
              await this.#s3.deleteObject({ Bucket: S3_BUCKET, Key: object.Key.replace('requests', 'responses') }).promise();
              logger.info('Deleted response object after 60s timeout.');
            }, 60000);

            await this.#s3.deleteObject({ Bucket: S3_BUCKET, Key: object.Key }).promise();
            logger.info('Deleted request object.');
          })();
        });
      } catch(e) {
        console.error(e);
      }
    }
  }

  async #processRequest(object, logger, startTime) {
    logger.info('Received new request.');

    const requestPathKey = object.Key;
    const responsePathKey = requestPathKey.replace('requests', 'responses');

    const thresholdSeconds = 30;
    const minAllowedTime = new Date();
    minAllowedTime.setSeconds(minAllowedTime.getSeconds() - thresholdSeconds);

    if (object.LastModified < minAllowedTime) {
      const message = `Client\`s request was sent more than ${thresholdSeconds} seconds ago. Skiping request.`;
      logger.error(message);

      logger.info('Uploading failure response to AWS S3...');
      await this.#s3.upload({
        Body: Buffer.from(JSON.stringify({ error: message }), 'utf-8'),
        Bucket: S3_BUCKET,
        ContentType: 'application/json',
        Key: responsePathKey,
      }).promise();
      logger.info('Failed in', (new Date() - startTime).toLocaleString(), 'ms.');

      return;
    }

    const thresholdSize = 1024 * 1024;

    if (object.Size > thresholdSize) {
      const message = `Client\`s request file size exceeds the maximum limit of ${thresholdSize} bytes. Skiping request.`;
      logger.error(message);

      logger.info('Uploading failure response to AWS S3...');
      await this.#s3.upload({
        Body: Buffer.from(JSON.stringify({ error: message }), 'utf-8'),
        Bucket: S3_BUCKET,
        ContentType: 'application/json',
        Key: responsePathKey,
      }).promise();
      logger.info('Failed in', (new Date() - startTime).toLocaleString(), 'ms.');

      return;
    }

    try {
      logger.info('Loading request file from the channel...');
      const clientRequestData = await this.#s3.getObject({ Bucket: S3_BUCKET, Key: requestPathKey }).promise();

      const buffer = clientRequestData.Body;

      const jsonString = buffer.toString();
      logger.info('Loaded request file from the channel.');

      logger.info('Parsing request file...');
      const {
        client: { id: clientId },
        request: { method, endpoint, headers, data },
      } = JSON.parse(jsonString);
      logger.info('Parsed request file.');

      logger.info('Loading client', clientId, 'info...');
      const client = Client.find(clientId);
      logger.info('Loaded client', JSON.stringify(client, null, 2));

      logger.info('Processing', method.toUpperCase(), client.urlFor(endpoint));
      const request = new Request({
        method,
        endpoint: client.urlFor(endpoint),
        headers,
        data,
      });
      const response = new Response(async ({ status, headers, data }) => {
        logger.info('Uploading response to AWS S3...');
        await this.#s3.upload({
          Body: Buffer.from(JSON.stringify({ response: { status, headers, data } }), 'utf-8'),
          Bucket: S3_BUCKET,
          ContentType: 'application/json',
          Key: responsePathKey,
        }).promise();
        logger.info('Uploaded response to AWS S3.');
        logger.info('Done in', (new Date() - startTime).toLocaleString(), 'ms.');
      });

      await this.#callback(client, request, response);
    } catch (error) {
      logger.error('Failed to process request!');
      console.error(error);

      logger.info('Uploading failure response to AWS S3...');
      await this.#s3.upload({
        Body: Buffer.from(JSON.stringify({ error: 'Failed to process request!' }), 'utf-8'),
        Bucket: S3_BUCKET,
        ContentType: 'application/json',
        Key: responsePathKey,
      }).promise();
      logger.info('Failed in', (new Date() - startTime).toLocaleString(), 'ms.');
    }
  }
}

export default Server;
