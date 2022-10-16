import APIGateway from './api/index.js';
import Server from './server.js';

const server = new Server();

server.listen(async (client, request, response) => {
  try {
    const { proxy } = client;
    const { method, endpoint: url, headers, data } = request;
    const result = await APIGateway.request({ method, url, data, headers, proxy });

    response.status = result.status;
    response.headers = result.headers;
    response.send(result.data);
  } catch (error) {
    if (error.response) {
      response.status = error.response.status;
      response.headers = error.response.headers;
      response.send(error.response.data);
    } else if (error.request) {
      response.status = 408;
      response.send();
    } else {
      response.send();
      console.error(error);
    }
  }
});
