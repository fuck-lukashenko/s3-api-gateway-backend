import axios from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';
import {
  PROXY_HOST,
  PROXY_PORT,
} from '../constants.js'

class APIGateway {
  constructor() {
    const config = {
      headers: { 'Content-Type': 'application/json' },
    }

    this.instance = axios.create({ ...config });

    if (PROXY_HOST && PROXY_PORT) {
      const httpsAgent = new HttpsProxyAgent({
        host: PROXY_HOST,
        port: PROXY_PORT,
      });

      config.httpsAgent = httpsAgent;
    }

    this.proxifiedInstance = axios.create(config);
  }

  request({ method, url, headers, data, proxy }) {
    if (proxy) {
      return this.proxifiedInstance.request({ method, url, headers, data });
    }

    return this.instance.request({ method, url, headers, data });
  }
}

export default new APIGateway();
