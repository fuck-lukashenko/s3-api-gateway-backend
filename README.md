# S3-based API Gateway

The backend of the API Gateway build on top of the AWS S3.

## Setup

Create AWS Lambda function to pass "request" files details to the Gateway:

```
import https from 'https';
import URL from 'url';

const sendWebhookAboutNewRequest = async (event) => {
  const data = {
    key: event.Records[0].s3.object.key,
    size: event.Records[0].s3.object.size,
    timestamp: event.Records[0].eventTime,
  };
  const jsonPayload = JSON.stringify(data);

  return new Promise((resolve, reject) => {
    const options = {
      ...URL.parse(process.env.S3_GATEWAY_WEBHOOK_URL),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonPayload),
      },
      timeout: 1000,
    };
    const req = https.request(options);
    req.write(jsonPayload);
    req.end(() => resolve());
  });
}

export const handler = async (event, context) => {
  await sendWebhookAboutNewRequest(event);

  return 'done';
};
```
