class Request {
  constructor({ method, endpoint, headers, data }) {
    this.method = method;
    this.endpoint = endpoint;
    this.headers = headers;
    this.data = data;
  }
}

export default Request;
